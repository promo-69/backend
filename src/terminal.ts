import { Router, Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

export const TerminalStreamer = Router();
const logEvents = new EventEmitter();

// Mantener un registro de los clientes conectados para forzar el cierre
const clients = new Set<Response>();

// Limpieza para el Hot Reloading (Vite/Nodemon) y cierre del servidor
const closeAllClients = () => {
    for (const client of clients) {
        client.end();
    }
    clients.clear();
};

process.once('SIGTERM', closeAllClients);
process.once('SIGINT', closeAllClients);
process.once('SIGUSR2', closeAllClients); // Nodemon restart signal

// Guardar la referencia a los métodos originales
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

// Hook para stdout
process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
    logEvents.emit('data', { type: 'info', text: chunk.toString() });
    return originalStdoutWrite(chunk, encoding, callback);
};

// Hook para stderr
process.stderr.write = (chunk: any, encoding?: any, callback?: any) => {
    logEvents.emit('data', { type: 'error', text: chunk.toString() });
    return originalStderrWrite(chunk, encoding, callback);
};

// Middleware de Autenticación Básica
const basicAuth = (req: Request, res: Response, next: NextFunction) => {
    const user = process.env.TERMINAL_USER;
    const pass = process.env.TERMINAL_PASS;

    if (!user || !pass) {
        return res.status(404).send('Terminal no configurada');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Terminal"');
        return res.status(401).send('Se requiere autenticación');
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    if (auth[0] === user && auth[1] === pass) {
        return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Terminal"');
    res.status(401).send('Credenciales inválidas');
};

TerminalStreamer.use(basicAuth);

// Endpoint SSE
TerminalStreamer.get('/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Mensaje de padding oculto para forzar a Nginx o proxies a vaciar su búfer inicial (4KB)
    res.write(': ' + ' '.repeat(4096) + '\n\n');

    // Mensaje de éxito inicial
    res.write(`data: ${JSON.stringify({ type: 'info', text: '\x1b[32m[✓] Terminal en vivo conectada y escuchando.\x1b[0m\n' })}\n\n`);

    // Enviar un comentario vacío cada 10 segundos para mantener viva la conexión
    const keepAlive = setInterval(() => {
        res.write(': ' + ' '.repeat(1024) + '\n\n');
    }, 10000);

    const onData = (data: { type: string, text: string }) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    logEvents.on('data', onData);
    clients.add(res);

    req.on('close', () => {
        clearInterval(keepAlive);
        logEvents.off('data', onData);
        clients.delete(res);
    });
});

// Interfaz Visual
TerminalStreamer.get('/', (req: Request, res: Response) => {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Server Terminal</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0f111a;
            --bg-panel: #1a1c29;
            --bg-glass: rgba(26, 28, 41, 0.7);
            --border-color: #2a2d3e;
            --text-main: #a6accd;
            --text-muted: #676e95;
            --accent: #82aaff;
            --error: #ff5370;
            --success: #c3e88d;
            --warning: #ffcb6b;
            --radius: 8px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            height: 100vh;
            display: flex;
            overflow: hidden;
        }

        /* Layout Principal */
        .app-container {
            display: flex;
            width: 100%;
            height: 100%;
        }

        /* Área de la Terminal */
        .terminal-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: var(--bg-dark);
            position: relative;
            min-width: 0;
        }

        .header {
            height: 50px;
            background-color: var(--bg-panel);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            padding: 0 20px;
            justify-content: space-between;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10;
        }

        .header h1 {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background-color: var(--success);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--success);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; box-shadow: 0 0 8px var(--success); }
            50% { opacity: 0.5; box-shadow: 0 0 2px var(--success); }
            100% { opacity: 1; box-shadow: 0 0 8px var(--success); }
        }

        .terminal-scroll-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            font-family: 'Fira Code', monospace;
            font-size: 13px;
            line-height: 1.5;
            scroll-behavior: smooth;
        }

        /* Estilos de líneas de log */
        .log-line {
            padding: 2px 4px;
            border-radius: 4px;
            word-wrap: break-word;
            white-space: pre-wrap;
            border-left: 2px solid transparent;
            margin-bottom: 2px;
            transition: background-color 0.2s;
        }

        .log-line:hover {
            background-color: rgba(255,255,255,0.03);
        }

        .log-line.error {
            border-left-color: var(--error);
            background-color: rgba(255, 83, 112, 0.05);
            color: #ff8a9f;
        }

        .log-line.error:hover {
            background-color: rgba(255, 83, 112, 0.1);
        }

        .log-line.highlight {
            animation: highlightFlash 2s forwards;
        }

        @keyframes highlightFlash {
            0% { background-color: rgba(130, 170, 255, 0.3); }
            100% { background-color: transparent; }
        }

        /* Panel Lateral (Sidebar) */
        .sidebar {
            width: 320px;
            background-color: var(--bg-panel);
            border-left: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 20;
        }

        .sidebar.collapsed {
            transform: translateX(100%);
            position: absolute;
            right: 0;
            height: 100%;
        }

        .sidebar-header {
            height: 50px;
            padding: 0 20px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        /* Elementos del panel lateral */
        .event-card {
            background-color: var(--bg-dark);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
            flex-shrink: 0; /* Evitar que flexbox aplaste las tarjetas */
        }

        .event-card:hover {
            border-color: var(--accent);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .event-card.error {
            border-left: 3px solid var(--error);
        }

        .event-card.info {
            border-left: 3px solid var(--accent);
        }

        .event-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }

        .event-badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            letter-spacing: 0.5px;
        }

        .event-badge.error { background-color: rgba(255, 83, 112, 0.2); color: var(--error); }
        .event-badge.info { background-color: rgba(130, 170, 255, 0.2); color: var(--accent); }

        .event-time {
            font-size: 11px;
            color: var(--text-muted);
        }

        .event-text {
            font-size: 12px;
            color: var(--text-main);
            display: -webkit-box;
            -webkit-line-clamp: 2; /* Mostrar hasta 2 líneas */
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-family: 'Fira Code', monospace;
            word-break: break-all;
            margin-top: 4px;
        }

        /* Botón toggle */
        .toggle-sidebar-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toggle-sidebar-btn:hover {
            background-color: rgba(255,255,255,0.05);
            color: var(--text-main);
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-dark); }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        /* Responsive Design */
        @media (max-width: 768px) {
            .sidebar {
                position: fixed;
                right: 0;
                top: 50px;
                height: calc(100% - 50px);
                width: 100%;
                max-width: 100%;
                border-left: none;
                box-shadow: -5px 0 15px rgba(0,0,0,0.5);
                z-index: 100;
            }
            
            .sidebar.collapsed {
                position: fixed;
                right: 0;
                top: 50px;
                height: calc(100% - 50px);
                transform: translateX(100%);
            }

            .terminal-scroll-area {
                font-size: 11px; /* Letra ligeramente más pequeña en móviles */
                padding: 10px;
            }

            .header {
                padding: 0 10px;
            }

            .header h1 {
                font-size: 12px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Izquierda: Terminal -->
        <div class="terminal-wrapper">
            <div class="header">
                <h1><div class="status-dot"></div> Live Server Terminal</h1>
                <div style="display: flex; gap: 8px; flex-shrink: 0; align-items: center;">
                    <button class="toggle-sidebar-btn" id="logoutBtn" title="Cerrar Sesión">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                    <button class="toggle-sidebar-btn" id="toggleBtn" title="Toggle Sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                    </button>
                </div>
            </div>
            <div class="terminal-scroll-area" id="terminal">
                <!-- Logs aparecerán aquí -->
            </div>
        </div>

        <!-- Derecha: Panel Lateral -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                Registro de Eventos
            </div>
            <div class="sidebar-content" id="sidebarContent">
                <!-- Tarjetas de eventos aparecerán aquí -->
            </div>
        </div>
    </div>

    <script>
        const terminal = document.getElementById('terminal');
        const sidebar = document.getElementById('sidebar');
        const sidebarContent = document.getElementById('sidebarContent');
        const toggleBtn = document.getElementById('toggleBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        let logCounter = 0;
        let isAutoScrollEnabled = true;

        // Auto-colapsar en móviles al inicio
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
        }

        // Toggle panel lateral
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });

        // Logout Basic Auth trick
        logoutBtn.addEventListener('click', () => {
            const url = new URL(window.location.href);
            url.username = 'cerrar';
            url.password = 'sesion';
            window.location.href = url.toString();
        });

        // Detectar si el usuario subió el scroll manualmente
        terminal.addEventListener('scroll', () => {
            const bottomThreshold = 30;
            isAutoScrollEnabled = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < bottomThreshold;
        });

        const ansiMap = {
            30: 'var(--text-main)', 31: 'var(--error)', 32: 'var(--success)', 33: 'var(--warning)',
            34: 'var(--accent)', 35: '#c792ea', 36: '#89ddff', 37: '#ffffff',
            90: 'var(--text-muted)', 91: '#ff8a9f', 92: '#d4edaa', 93: '#ffe2a1',
            94: '#b0caff', 95: '#e2bbf0', 96: '#b5e8ff', 97: '#ffffff'
        };

        function parseANSI(text) {
            let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html = html.replace(/\\x1b\\[([0-9;]*)m/g, (match, codes) => {
                if (codes === '0' || codes === '39' || codes === '') return '</span>';
                const codeParts = codes.split(';');
                let style = '';
                for (let c of codeParts) {
                    if (ansiMap[c]) style += 'color:' + ansiMap[c] + ';';
                    if (c === '1') style += 'font-weight:bold;';
                    if (c === '3') style += 'font-style:italic;';
                    if (c === '4') style += 'text-decoration:underline;';
                }
                return style ? '<span style="' + style + '">' : '<span>';
            });
            const openSpans = (html.match(/<span/g) || []).length;
            const closeSpans = (html.match(/<\\/span>/g) || []).length;
            if (openSpans > closeSpans) {
                html += '</span>'.repeat(openSpans - closeSpans);
            }
            return html;
        }

        // Remover códigos ANSI para el texto plano del sidebar
        function stripANSI(text) {
            return text.replace(/\\x1b\\[[0-9;]*m/g, '');
        }

        function scrollToLog(id) {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.remove('highlight');
                // Trigger reflow
                void element.offsetWidth;
                element.classList.add('highlight');
            }
        }

        function appendLog(dataObj) {
            logCounter++;
            const logId = 'log-' + logCounter;
            const isError = dataObj.type === 'error';
            
            // 1. Crear línea en Terminal
            const div = document.createElement('div');
            div.id = logId;
            div.className = 'log-line ' + (isError ? 'error' : 'normal');
            div.innerHTML = parseANSI(dataObj.text);
            terminal.appendChild(div);

            // Auto-scroll inteligente
            if (isAutoScrollEnabled) {
                terminal.scrollTop = terminal.scrollHeight;
            }

            // 2. Crear Tarjeta en Sidebar
            const plainText = stripANSI(dataObj.text).trim();
            if (plainText.length === 0) return;

            const card = document.createElement('div');
            card.className = 'event-card ' + (isError ? 'error' : 'info');
            card.onclick = () => {
                scrollToLog(logId);
                // Si estamos en móvil, cerramos el panel automáticamente al tocar un evento para ver la terminal
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('collapsed');
                }
            };
            
            const timeStr = new Date().toLocaleTimeString('es-ES', { hour12: false });
            
            card.innerHTML = \`
                <div class="event-header">
                    <span class="event-badge \${isError ? 'error' : 'info'}">\${isError ? 'ERROR' : 'INFO'}</span>
                    <span class="event-time">\${timeStr}</span>
                </div>
                <div class="event-text">\${plainText.replace(/</g, '&lt;')}</div>
            \`;

            sidebarContent.appendChild(card);
            
            // Limitar elementos en memoria
            if (terminal.childElementCount > 1000) {
                terminal.removeChild(terminal.firstElementChild);
            }
            if (sidebarContent.childElementCount > 500) {
                sidebarContent.removeChild(sidebarContent.firstElementChild);
            }
        }

        async function connect() {
            try {
                const response = await fetch('/api/system/terminal/stream');
                if (!response.ok) throw new Error('HTTP ' + response.status);
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    let parts = buffer.split('\\n\\n');
                    buffer = parts.pop(); 

                    for (let part of parts) {
                        if (part.startsWith('data: ')) {
                            let jsonStr = part.substring(6);
                            try {
                                let data = JSON.parse(jsonStr);
                                appendLog(data);
                            } catch (e) {
                                console.error('Error parsing JSON:', jsonStr, e);
                            }
                        }
                    }
                }
                throw new Error('El servidor cerró el stream silenciosamente.');
            } catch (err) {
                appendLog({ type: 'error', text: '\\n[!] Conexión perdida o error: ' + err.message + '\\n' });
                document.querySelector('.status-dot').style.backgroundColor = 'var(--error)';
                document.querySelector('.status-dot').style.animation = 'none';
            }
        }

        connect();
    </script>
</body>
</html>`;
    res.send(html);
});
