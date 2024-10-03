// socket.js (socket.ioのカスタムフック)
import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

const useSocket = (url: string): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(url);
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return socket;
};

export default useSocket;
