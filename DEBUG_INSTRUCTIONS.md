# Debug Instructions for Socket Connection Issues

The loading spinner issue is likely due to socket connection problems. Here's how to debug:

## 1. Check Console Logs

When you click "Create Room" or "Join Room", check the console for these messages:
- "Socket connected: [socket-id]" - Should appear when app starts
- "Creating room..." or "Joining room..."
- "Emitting create-room with playerName: [name]"
- "Room created: [data]" - Should appear after creating room

## 2. Common Issues and Solutions

### Socket Not Connecting
If you see "Socket not connected" or no "Socket connected" message:
1. The server URL might be incorrect
2. CORS might be blocking the connection
3. The server might be down

### Events Not Being Received
If socket is connected but no "Room created" message appears:
1. The server might use different event names
2. The server might expect different data format

## 3. Quick Fixes to Try

### Fix 1: Force HTTPS in Socket Connection
In `src/contexts/SocketContext.js`, change line 8:
```javascript
const SERVER_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';
```

### Fix 2: Add Additional Socket Options
In `src/contexts/SocketContext.js`, update the socket connection (around line 47):
```javascript
const newSocket = io(SERVER_URL, {
  transports: ['websocket', 'polling'], // Add polling as fallback
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  forceNew: true, // Force new connection
});
```

### Fix 3: Test Socket Connection
Add this test button to HomeScreen to verify socket connection:
```javascript
<TouchableOpacity
  style={commonStyles.buttonSecondary}
  onPress={() => {
    const socket = global.socketInstance;
    console.log('Socket test:', {
      exists: !!socket,
      connected: socket?.connected,
      id: socket?.id,
    });
    alert(`Socket: ${socket?.connected ? 'Connected' : 'Not connected'}`);
  }}
>
  <Text style={commonStyles.buttonTextSecondary}>Test Socket</Text>
</TouchableOpacity>
```

## 4. Server Compatibility Check

The mobile app expects these socket events from the server:
- Emit: `create-room` → Receive: `room-created`
- Emit: `join-room` → Receive: `player-joined` or `join-room-success`
- Emit: `start-game` → Receive: `game-starting`

Make sure your server sends these exact event names.

## 5. Network Issues

If running on a physical device:
- Make sure device is on same network as development machine
- Try using the server's public URL instead of localhost
- Check if the server allows connections from mobile devices

After applying fixes, restart the Expo server:
```bash
npx expo start -c
```