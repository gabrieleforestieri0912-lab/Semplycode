// Pool di snippet di codice per il background animato della hero
// Ogni snippet ha: linguaggio, codice, lunghezza (per varietà nella selezione)

export type CodeSnippet = {
  id: string
  language: "javascript" | "typescript" | "python" | "jsx" | "java" | "go" | "rust" | "php" | "sql" | "cpp" | "csharp" | "css"
  code: string
}

export const codeSnippets: CodeSnippet[] = [
  {
    id: "js-fetch-user",
    language: "javascript",
    code: `async function fetchUserData(userId) {
  const response = await fetch(\`/api/users/\${userId}\`)
  if (!response.ok) {
    throw new Error("Failed to fetch user")
  }
  return response.json()
}`,
  },
  {
    id: "ts-debounce",
    language: "typescript",
    code: `function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}`,
  },
  {
    id: "py-calculate-total",
    language: "python",
    code: `def calculate_total(items, tax_rate=0.1):
    subtotal = sum(item["price"] * item["qty"] for item in items)
    tax = subtotal * tax_rate
    return round(subtotal + tax, 2)`,
  },
  {
    id: "jsx-use-toggle",
    language: "jsx",
    code: `function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue(v => !v), [])
  return [value, toggle]
}`,
  },
  {
    id: "js-try-catch",
    language: "javascript",
    code: `async function handleSubmit(formData) {
  try {
    const result = await saveToDatabase(formData)
    return { success: true, data: result }
  } catch (error) {
    console.error("Submit failed:", error.message)
    return { success: false, error: error.message }
  }
}`,
  },
  {
    id: "py-regex-email",
    language: "python",
    code: `import re

def is_valid_email(email):
    pattern = r"^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None`,
  },
  {
    id: "ts-destructure",
    language: "typescript",
    code: `interface Product {
  id: string
  name: string
  price: number
}

const { id, name, ...rest } = product`,
  },
  {
    id: "jsx-fetch-effect",
    language: "jsx",
    code: `function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchUserData(userId).then(setUser)
  }, [userId])

  if (!user) return <Spinner />
  return <ProfileCard user={user} />
}`,
  },
  {
    id: "js-array-methods",
    language: "javascript",
    code: `const activeUsers = users
  .filter(user => user.isActive)
  .map(user => ({ ...user, lastSeen: formatDate(user.lastSeen) }))
  .sort((a, b) => b.score - a.score)`,
  },
  {
    id: "py-class-basic",
    language: "python",
    code: `class ShoppingCart:
    def __init__(self):
        self.items = []

    def add_item(self, item, quantity=1):
        self.items.append({"item": item, "quantity": quantity})

    def total_items(self):
        return sum(i["quantity"] for i in self.items)`,
  },
  {
    id: "ts-generic-api",
    language: "typescript",
    code: `async function apiRequest<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(\`Request failed: \${res.status}\`)
  return res.json() as Promise<T>
}`,
  },
  {
    id: "js-binary-search",
    language: "javascript",
    code: `function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (arr[mid] === target) return mid
    arr[mid] < target ? (low = mid + 1) : (high = mid - 1)
  }
  return -1
}`,
  },
  {
    id: "jsx-form-handler",
    language: "jsx",
    code: `function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "" })

  const handleChange = (e) => {
    setValues(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return <form onSubmit={handleSubmit}>...</form>
}`,
  },
  {
    id: "py-decorator-timer",
    language: "python",
    code: `import time
from functools import wraps

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time() - start:.3f}s")
        return result
    return wrapper`,
  },
  {
    id: "ts-safe-json-parse",
    language: "typescript",
    code: `function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}`,
  },
  {
    id: "js-switch",
    language: "javascript",
    code: `function getStatusLabel(code) {
  switch (code) {
    case 200: return "OK";
    case 404: return "Not Found";
    case 500: return "Server Error";
    default: return code >= 400 ? "Error" : "Unknown";
  }
}`,
  },
  {
    id: "js-ternary-regex",
    language: "javascript",
    code: `const normalize = (value) => {
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  return re.test(value) ? value.trim().toLowerCase() : null;
};`,
  },
  {
    id: "ts-class-ctor",
    language: "typescript",
    code: `class ApiClient {
  constructor(private baseUrl: string) {}
  async get<T>(path: string): Promise<T> {
    const res = await fetch(\`\${this.baseUrl}\${path}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json() as Promise<T>;
  }
  isRetryable = (e: Error) => e.message.includes("429") ? true : false;
}`,
  },
  {
    id: "py-loop-match",
    language: "python",
    code: `for i, item in enumerate(items):
    match item["type"]:
        case "book":
            print(f"Libro: {item['title']}")
        case _:
            print(f"Altro: {item}")
    total += item["price"] if item["qty"] > 0 else 0`,
  },
  {
    id: "java-switch-class",
    language: "java",
    code: `class AuthService {
  String roleFor(int code) {
    switch (code) {
      case 200: return "OK";
      case 401: return isExpired ? "Expired" : "Unauthorized";
      default: return "Unknown";
    }
  }
  boolean isValid(String s) {
    return s.matches("^[a-z0-9._%+-]+@[a-z]+\\\\.[a-z]{2,}$");
  }
}`,
  },
  {
    id: "go-loop-regex",
    language: "go",
    code: `func FilterActive(users []User) []User {
  re := regexp.MustCompile("^[a-z0-9._%+-]+@")
  var out []User
  for _, u := range users {
    if !u.Active { continue }
    if re.MatchString(u.Email) {
      out = append(out, u)
    }
  }
  return out
}`,
  },
  {
    id: "rust-match-loop",
    language: "rust",
    code: `fn classify(n: i32) -> String {
  match n {
    0 => "zero".to_string(),
    n if n % 2 == 0 => format!("even: {}", n),
    _ => "odd".to_string(),
  }
}
for x in 0..10 {
  println!("{}", classify(x));
}`,
  },
  {
    id: "php-ternary-switch",
    language: "php",
    code: `function label(int $code): string {
  return match($code) {
    200 => "OK",
    404 => "Not Found",
    default => $code >= 500 ? "Server Error" : "Unknown",
  };
}
$emailValid = preg_match("/^[\\w.%+-]+@[\\w-]+\\.[a-z]{2,}$/i", $email) ? $email : null;`,
  },
  {
    id: "sql-join-case",
    language: "sql",
    code: `SELECT u.name,
  CASE WHEN u.active THEN 'active' ELSE 'inactive' END as status,
  COUNT(o.id) as orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.email ~ '^[a-z0-9._%+-]+@'
GROUP BY u.id;`,
  },
  {
    id: "cpp-template-loop",
    language: "cpp",
    code: `template<typename T>
class Cache {
  T get(const string& key) {
    auto it = store.find(key);
    return it != store.end() ? it->second : T{};
  }
  void sweep() {
    for (auto &[k, v] : store) {
      if (v.expired()) store.erase(k);
    }
  }
};`,
  },
  {
    id: "csharp-class-regex",
    language: "csharp",
    code: `class Validator {
  bool IsEmail(string s) => Regex.IsMatch(s, @"^[\\w.%+-]+@[\\w-]+\\.[A-Za-z]{2,}$");
  string Role(int code) => code switch {
    200 => "OK",
    404 => code > 400 ? "Not Found" : "Unknown",
    _ => "Error"
  };
}`,
  },
  {
    id: "css-media-ternary",
    language: "css",
    code: `.card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
@media (max-width: 640px) {
  .card { --cols: 1; }
}
.badge::after { content: var(--active) ? "ON" : "OFF"; }`,
  },
]