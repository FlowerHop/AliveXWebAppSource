package bluetooth;

import websocket.SocketActivity;
import java.io.IOException;
import java.io.InputStream;
import javax.microedition.io.Connector;
import javax.microedition.io.StreamConnection;

public class BTConnection implements Runnable {

    private String urlBTDevice;
    private boolean mCancel = false;
    private SocketActivity mSocket;

    public BTConnection(String url) {
        urlBTDevice = url;
        mSocket = new SocketActivity();
    }

    public void run() {
        StreamConnection connection = null;
        try {
            System.out.println("Pair with " + urlBTDevice);
            connection = (StreamConnection) Connector.open(urlBTDevice);
        } catch (IOException e) {
            e.printStackTrace();
        }

        /* Start connection */
        try {
            InputStream inStream = connection.openInputStream();
            byte[] streamBuffer = new byte[256];

            int test = 0;

            while (!mCancel) {
                int nBytesRead;
                nBytesRead = inStream.read(streamBuffer); // Blocks until data arrives

                for (int n = 0; n < nBytesRead; n++) {
                    // 1. Send this signal to specified socket
                    // 2. Test the form and the length of streamBuffer[n]
                    mSocket.onAliveSignals(streamBuffer[n]);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        /* Disable connection */
        try {
            connection.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("Connection close");
    }

    public void cancel() {
        mCancel = true;
    }
}
