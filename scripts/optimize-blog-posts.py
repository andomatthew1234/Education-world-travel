import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

root = Path('.')
blog_dir = root / 'blog'
data_dir = root / 'data'
data_dir.mkdir(exist_ok=True)


def parse_frontmatter(raw):
    meta = {}
    for line in raw.strip().splitlines():
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        key = key.strip()
        value = value.strip().strip("'")
        if key == 'categories':
            values = re.findall(r"'([^']+)'", line)
            meta[key] = values
        else:
            meta[key] = value
    return meta


def inline_text(node):
    if isinstance(node, NavigableString):
        return str(node)
    if isinstance(node, Tag):
        if node.name == 'br':
            return '\n'
        if node.name in ('strong', 'b'):
            inner = ''.join(inline_text(c) for c in node.children).strip()
            return f'**{inner}**' if inner else ''
        if node.name in ('em', 'i'):
            inner = ''.join(inline_text(c) for c in node.children).strip()
            return f'*{inner}*' if inner else ''
        if node.name == 'a':
            href = node.get('href', '').strip()
            text = ''.join(inline_text(c) for c in node.children).strip()
            if not text:
                return ''
            if href and href.startswith('http'):
                return f'[{text}]({href})'
            return text
        if node.name in ('span', 'div', 'section', 'article', 'header', 'footer'):
            return ''.join(inline_text(c) for c in node.children)
        if node.name == 'p':
            return ''.join(inline_text(c) for c in node.children)
        if node.name == 'li':
            return ''.join(inline_text(c) for c in node.children).strip()
        return ''.join(inline_text(c) for c in node.children)
    return ''


def normalize(text):
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def is_heading_line(text):
    if not text:
        return False
    if len(text) > 80:
        return False
    if text.endswith('.') or text.endswith('?') or text.endswith('!') or text.endswith(':'):
        return False
    if text.lower().startswith(('and ', 'the ', 'a ', 'an ', 'we ', 'our ', 'it ', 'they ')) and len(text.split()) > 6:
        return False
    if any(ch.isdigit() for ch in text) and len(text.split()) < 6:
        return True
    if text == text.title() or text[0].isupper():
        return True
    return False


def list_to_markdown(list_tag):
    items = []
    ordered = list_tag.name == 'ol'
    for idx, li in enumerate(list_tag.find_all('li', recursive=False), start=1):
        item_text = normalize(inline_text(li))
        if item_text:
            if ordered:
                items.append(f'{idx}. {item_text}')
            else:
                items.append(f'- {item_text}')
    return '\n'.join(items)


def extract_body_from_html(section):
    blocks = []
    for node in section.find_all('div', attrs={'data-breakout': 'normal'}, recursive=True):
        heading = node.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], recursive=False)
        if heading:
            text = normalize(inline_text(heading))
            if text:
                level = int(heading.name[1:]) if heading.name.startswith('h') and heading.name[1:].isdigit() else 2
                blocks.append(f"{'#' * level} {text}")
            continue
        list_tag = node.find(['ol', 'ul'], recursive=False)
        if list_tag:
            list_md = list_to_markdown(list_tag)
            if list_md:
                blocks.append(list_md)
            continue
        para = node.find('p', recursive=False)
        if para:
            text = normalize(inline_text(para))
            if text:
                blocks.append(text)
            continue
        inner_div = node.find('div', recursive=False)
        if inner_div:
            text = normalize(inline_text(inner_div))
            if text:
                blocks.append(text)
            continue
    return '\n\n'.join([block for block in blocks if block])


def parse_live_metadata(soup):
    meta = {}
    article = soup.find('article')
    if not article:
        return meta
    container = article.find('div', class_='HW6ttf')
    if not container:
        return meta
    header = container.find('header')
    footer = container.find('footer')
    if header:
        text = header.get_text(separator='|', strip=True)
        parts = [p.strip() for p in text.split('|') if p.strip()]
        for part in parts:
            if 'min read' in part.lower():
                meta['readTime'] = part
            elif part.lower().startswith('updated:'):
                meta['updated'] = part.split(':', 1)[1].strip()
    if footer:
        footer_text = footer.get_text(separator='|', strip=True)
        cats = [p.strip() for p in footer_text.split('|') if p.strip()]
        if cats:
            meta['footer_categories'] = cats
    return meta


def extract_markdown_from_url(url):
    resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)
    soup = BeautifulSoup(resp.text, 'html.parser')
    article = soup.find('article')
    if not article:
        return '', {}
    content = article.find('div', class_='HW6ttf')
    if not content:
        return '', {}
    section = content.find('section', class_='VQDdIN')
    if not section:
        return '', {}
    body_md = extract_body_from_html(section)
    meta = parse_live_metadata(soup)
    return body_md, meta


def pretty_date(iso_date):
    from datetime import datetime
    try:
        dt = datetime.strptime(iso_date, '%a, %d %b %Y %H:%M:%S %Z')
        return dt.strftime('%b %d, %Y')
    except Exception:
        return iso_date


posts = []
for path in sorted(blog_dir.glob('*.md')):
    if path.name == 'index.md':
        continue
    text = path.read_text(encoding='utf-8')
    parts = text.split('---', 2)
    if len(parts) < 3:
        continue
    front_raw = parts[1].strip()
    meta = parse_frontmatter(front_raw)
    body_md = ''
    live_meta = {}
    if meta.get('link'):
        try:
            body_md, live_meta = extract_markdown_from_url(meta['link'])
        except Exception as e:
            print(f'Failed to extract {path.name} from URL: {e}')
    if body_md and not body_md.startswith('# '):
        body_md = f'# {meta.get("title", "")}\n\n' + body_md
    output_text = f'---\n{front_raw}\n---\n\n{body_md.strip()}\n'
    path.write_text(output_text, encoding='utf-8')
    slug = path.stem
    post_categories = meta.get('categories', [])
    if live_meta.get('footer_categories'):
        post_categories = live_meta['footer_categories']
    posts.append({
        'title': meta.get('title', slug.replace('-', ' ').title()),
        'link': meta.get('link', ''),
        'date': meta.get('date', ''),
        'author': meta.get('author', ''),
        'categories': post_categories,
        'excerpt': meta.get('excerpt', ''),
        'slug': slug,
        'filename': f'blog/{path.name}',
        'readTime': live_meta.get('readTime', '') or '',
        'updated': live_meta.get('updated', '') or '',
    })

with open(data_dir / 'blog-list.json', 'w', encoding='utf-8') as f:
    json.dump(posts, f, indent=2, ensure_ascii=False)

print('Optimized', len(posts), 'blog posts and updated data/blog-list.json')
