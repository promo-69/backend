import os
import re
from typing import Set


def extract_arguments_from_ts(file_path: str, function_name: str) -> Set[str]:
    arguments = set()

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Regex explicada:
        # \b{function_name}\s*\( -> Busca el nombre de la función seguido de un paréntesis abierto
        # (.*?)                  -> Captura todo lo que esté adentro (non-greedy) incluyendo saltos de línea
        # \)                     -> Hasta el paréntesis de cierre
        # re.DOTALL hace que el punto '.' acepte saltos de línea (\n)
        pattern = rf"\b{function_name}\s*\((.*?)\)"
        matches = re.findall(pattern, content, re.DOTALL)

        for match in matches:
            # Limpiamos espacios, saltos de línea y comentarios internos simples
            clean_match = match.strip()

            # Si la función recibe múltiples argumentos separados por coma, los dividimos
            # Ej: verifyPermission('admin', currentCompanyId) -> [''admin'', 'currentCompanyId']
            raw_args = [a.strip() for a in clean_match.split(",") if a.strip()]

            for arg in raw_args:
                # Si es un string literal con comillas simples, dobles o backticks (template literals)
                # Removemos las comillas para quedarnos solo con el valor limpio
                string_match = re.match(r"^['\"`](.*?)['\"`]$", arg)
                if string_match:
                    arguments.add(string_match.group(1))
                else:
                    # Si es una variable, objeto o expresión lógica (ej: Roles.ADMIN o user.id)
                    if arg:
                        arguments.add(f"Dynamic/Variable: {arg}")

    except Exception as e:
        print(f"Error leyendo {file_path}: {e}")

    return arguments


def analyze_ts_repository(repo_path: str, function_name: str) -> Set[str]:
    all_arguments = set()

    # Extensiones comunes de proyectos en TypeScript
    ts_extensions = (".ts", ".tsx")

    for root, dirs, files in os.walk(repo_path):
        # Opcional: Evitamos escanear node_modules o carpetas de build para ir un 1000% más rápido
        if "node_modules" in root or "dist" in root or ".git" in root:
            continue

        for file in files:
            if file.endswith(ts_extensions):
                file_path = os.path.join(root, file)
                file_args = extract_arguments_from_ts(file_path, function_name)
                all_arguments.update(file_args)

    return all_arguments


if __name__ == "__main__":
    REPO_DIR = "."  # Ruta de tu repositorio
    TARGET_FUNC = "verifyPermission"

    print(
        f"Buscando en archivos TypeScript de '{REPO_DIR}' la función '{TARGET_FUNC}'..."
    )
    result = analyze_ts_repository(REPO_DIR, TARGET_FUNC)

    print("\n--- Argumentos Únicos Encontrados ---")
    if result:
        # Separamos los strings limpios de los dinámicos para ordenarlos mejor
        literals = sorted([a for a in result if not a.startswith("Dynamic/")])
        dynamics = sorted([a for a in result if a.startswith("Dynamic/")])

        print("[Literales/Permisos directos]:")
        for arg in literals:
            print(f"  ✓ {arg}")

        if dynamics:
            print("\n[Valores dinámicos/Variables]:")
            for arg in dynamics:
                print(f"  ⚠ {arg}")
    else:
        print("No se encontraron instancias.")