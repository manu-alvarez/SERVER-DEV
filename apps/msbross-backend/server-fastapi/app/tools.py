import ast, operator, io, re, urllib.request, urllib.parse
from contextlib import redirect_stdout


def web_search(query: str) -> str:
    try:
        data = urllib.parse.urlencode({"q": query}).encode("utf-8")
        req = urllib.request.Request(
            "https://lite.duckduckgo.com/lite/",
            data=data,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        )
        html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8")
        snippets = re.findall(r"<td class=\'result-snippet\'>(.*?)</td>", html, re.IGNORECASE | re.DOTALL)
        clean_snippets = [re.sub(r"<[^>]+>", "", s).strip() for s in snippets]
        if not clean_snippets:
            return "No se encontraron resultados."
        return "Resultados web:\n" + "\n".join(f"- {s}" for s in clean_snippets[:5])
    except Exception as e:
        return f"Error en búsqueda web: {e}"


def db_query(sql: str) -> str:
    from app.db import _get_conn

    try:
        if not sql.strip().upper().startswith("SELECT"):
            return "Error: Solo se permiten sentencias SELECT por seguridad."
        with _get_conn() as conn:
            c = conn.execute(sql)
            rows = c.fetchmany(20)
            cols = [desc[0] for desc in c.description]
            res = f"Columnas: {cols}\nResultados:\n"
            for r in rows:
                res += f"{r}\n"
            return res
    except Exception as e:
        return f"Error SQL: {e}"


def _eval_expr(node):
    if isinstance(node, ast.Constant):
        return node.n if isinstance(node.n, (int, float)) else 0
    if isinstance(node, ast.BinOp):
        ops = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.Pow: operator.pow,
        }
        if type(node.op) in ops:
            return ops[type(node.op)](_eval_expr(node.left), _eval_expr(node.right))
    if isinstance(node, ast.UnaryOp):
        if isinstance(node.op, ast.USub):
            return -_eval_expr(node.operand)
        if isinstance(node.op, ast.UAdd):
            return _eval_expr(node.operand)
    raise TypeError(node)


def calculator(expr: str) -> str:
    try:
        safe = re.sub(r"[^0-9+\-*/.()% ]", "", expr)
        result = _eval_expr(ast.parse(safe, mode="eval").body)
        return str(result)
    except Exception as e:
        return f"Error matemático: {e}"


def code_interpreter(code: str) -> str:
    try:
        f = io.StringIO()
        with redirect_stdout(f):
            exec(code, {"__builtins__": __builtins__}, {})
        out = f.getvalue()
        return out if out else "Código ejecutado sin errores (sin salida por consola)."
    except Exception as e:
        return f"Error en ejecución Python: {e}"
