function detectLanguage(code) {
  if (/^\s*import\s+.*\s+from\s+['"].*['"]/.test(code) || /const |let |var |function |=>\s*{/.test(code))
    return "javascript";
  if (/def\s+\w+\(.*\):|import\s+\w+|print\(.*\)/.test(code)) return "python";
  if (/<[a-z][\s\S]*>/i.test(code)) return "html";
  if (/[a-z-]+\s*:\s*[^;]+;/.test(code) && /[{}]/.test(code)) return "css";
  if (/public\s+(static\s+)?void|System\.out\./.test(code)) return "java";
  if (/#include|printf|scanf|int\s+main/.test(code)) return "c";
  if (/func\s+\w+\(|package\s+main/.test(code)) return "go";
  if (/fn\s+\w+|let\s+mut|println!/.test(code)) return "rust";
  return "javascript";
}

describe('detectLanguage', () => {
  it('detects javascript', () => {
    expect(detectLanguage('const x = 1;')).toBe('javascript');
    expect(detectLanguage('function hello() {}')).toBe('javascript');
    expect(detectLanguage('let x = () => {}')).toBe('javascript');
  });

  it('detects python', () => {
    expect(detectLanguage('def hello():')).toBe('python');
    expect(detectLanguage('print("hello")')).toBe('python');
    expect(detectLanguage('import os')).toBe('python');
  });

  it('detects html', () => {
    expect(detectLanguage('<div>content</div>')).toBe('html');
    expect(detectLanguage('<html><body></body></html>')).toBe('html');
  });

  it('detects css', () => {
    expect(detectLanguage('.button { color: red; }')).toBe('css');
  });

  it('detects java', () => {
    expect(detectLanguage('public static void main() {}')).toBe('java');
    expect(detectLanguage('System.out.println("hello");')).toBe('java');
  });

  it('detects c', () => {
    expect(detectLanguage('int main() { printf("hello"); }')).toBe('c');
    expect(detectLanguage('scanf("%d", &x);')).toBe('c');
  });

  it('detects go', () => {
    expect(detectLanguage('func main() {}')).toBe('go');
    expect(detectLanguage('package main')).toBe('go');
  });

  it('detects rust', () => {
    expect(detectLanguage('fn main() {}')).toBe('rust');
    expect(detectLanguage('println!("hello");')).toBe('rust');
  });

  it('defaults to javascript', () => {
    expect(detectLanguage('some random text')).toBe('javascript');
  });
});
