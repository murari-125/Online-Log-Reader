import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const socket = new WebSocket(`ws://${window.location.host}`);

function App() {
  const [logs, setLogs] = useState('');

  useEffect(() => {
    socket.addEventListener('message', (event) => {
      setLogs((prevLogs) => prevLogs + event.data);
    });
  }, []);

  return (
    <div>
      <pre>{logs}</pre>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));