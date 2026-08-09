import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

const GODMODE_TOKEN = process.env.EXPO_PUBLIC_GODMODE_TOKEN || "";
const WS_URL = "wss://assistant.manuelalvarez.dev/_msbross/ws/nodes/";

// Generar ID único para este dispositivo
const NODE_ID = "rn-node-" + Math.random().toString(36).substring(2, 8);

export default function App() {
  const [status, setStatus] = useState("DISCONNECTED");
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const logMessage = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const connect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setStatus("CONNECTING...");
    logMessage("Initializing WebSocket connection...");

    try {
      // Nota: En React Native se puede pasar un tercer argumento para headers
      // @ts-ignore: React Native WebSocket accepts a 3rd argument for headers but TS types don't include it.
      const ws = new WebSocket(WS_URL + NODE_ID, undefined, {
        headers: {
          "x-godmode-token": GODMODE_TOKEN
        }
      } as any);

      ws.onopen = () => {
        setStatus("CONNECTED");
        logMessage("Connected to C2 Gateway successfully.");
      };

      ws.onmessage = (e) => {
        logMessage(`Received payload: ${e.data}`);
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.task_id && parsed.command) {
            handleCommand(parsed.task_id, parsed.command, ws);
          }
        } catch (err) {
          logMessage("Failed to parse payload");
        }
      };

      ws.onerror = (e: any) => {
        logMessage(`Connection Error: ${e.message || 'Unknown error'}`);
      };

      ws.onclose = () => {
        setStatus("DISCONNECTED");
        logMessage("Connection closed by remote host.");
      };

      wsRef.current = ws;
    } catch (e: any) {
      setStatus("ERROR");
      logMessage(`Init Error: ${e.message}`);
    }
  };

  const handleCommand = (taskId: string, command: string, ws: WebSocket) => {
    logMessage(`Executing: ${command}`);
    
    // Simular ejecución en móvil
    let result = "";
    if (command.startsWith("echo ")) {
      result = command.replace("echo ", "");
    } else if (command === "info") {
      result = `Mobile Node [${NODE_ID}]\nOS: React Native (Expo)\nStatus: Active`;
    } else {
      result = `Mobile App Constraint: Cannot execute raw shell command '${command}' directly.`;
    }

    const payload = {
      task_id: taskId,
      status: "success",
      result: result
    };

    ws.send(JSON.stringify(payload));
    logMessage(`Result dispatched for task ${taskId}`);
  };

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>C2 NODE: {NODE_ID}</Text>
        <View style={[styles.statusBadge, status === "CONNECTED" ? styles.bgGreen : styles.bgRed]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={connect}>
          <Text style={styles.btnText}>FORCE RECONNECT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => wsRef.current?.close()}>
          <Text style={styles.btnText}>DISCONNECT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.terminal}>
        <Text style={styles.terminalHeader}>TERMINAL LOGS</Text>
        <ScrollView style={styles.scroll}>
          {logs.map((l, i) => (
            <Text key={i} style={styles.logText}>{l}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#00ffcc',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  bgGreen: { backgroundColor: '#006600' },
  bgRed: { backgroundColor: '#660000' },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  btn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  btnDanger: {
    borderColor: '#660000',
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  terminal: {
    flex: 1,
    backgroundColor: '#000',
    margin: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  terminalHeader: {
    backgroundColor: '#111',
    color: '#666',
    padding: 8,
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scroll: {
    padding: 10,
  },
  logText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 4,
  }
});
