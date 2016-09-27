package websocket;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.ServerSocket;
import java.net.Socket;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.bind.DatatypeConverter;

public class SocketActivity {
    private static boolean mmConnected = false;
    private boolean mmCancel = false;
    private OutputStream out;

    public SocketActivity() {
        HandShaking();
    }

    public void HandShaking() {
        ServerSocket server = null;
        try {
            server = new ServerSocket(80);
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("Server has started on 127.0.0.1:80.\r\nWaiting for a connection...");

        Socket client = null;
        try {
            client = server.accept(); // Blocks until a client connected
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("A client connected.");

        InputStream in = null;
        try {
            in = client.getInputStream();
        } catch (IOException e) {
            e.printStackTrace();
        }

        // Translate bytes of request to string
        String data = new Scanner(in,"UTF-8").useDelimiter("\\r\\n\\r\\n").next();
        Matcher get = Pattern.compile("^GET").matcher(data);
        if (get.find()) {
            System.out.println("Receive get request");
            Matcher match = Pattern.compile("Sec-WebSocket-Key: (.*)").matcher(data);
            match.find();
            byte[] response = null;
            try {
                response = ("HTTP/1.1 101 Switching Protocols\r\n"
                        + "Connection: Upgrade\r\n"
                        + "Upgrade: websocket\r\n"
                        + "Sec-WebSocket-Accept: "
                        + DatatypeConverter
                        .printBase64Binary(
                                MessageDigest
                                .getInstance("SHA-1")
                                .digest((match.group(1) + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
                                        .getBytes("UTF-8")))
                        + "\r\n\r\n")
                        .getBytes("UTF-8");
            } catch (UnsupportedEncodingException | NoSuchAlgorithmException e) {
                e.printStackTrace();
            }

            out = null;
            try {
                out = client.getOutputStream();
                out.write(response, 0, response.length);
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {

        }
        mmConnected = true;
        System.out.println("HandShaking is done");
    }

    public void onAliveSignals(byte tmpSignal) {
        if(mmConnected) {
            byte[] mFrame = new byte[3];
            mFrame[0] = (byte) 130;
            mFrame[1] = 1;
            mFrame[2] = tmpSignal;

            try {
                out.write(mFrame);
            } catch (IOException e) {
                System.out.println("Unable to send the frame");
                e.printStackTrace();
            }
        }
    }

    /*
     // debug for test
    public static void main(String[] args) {
        SocketActivity mySocket = new SocketActivity();
        byte test = -86;
        mmConnected = true;
        System.out.println("Before sending the test frame");
        mySocket.onAliveSignals(test);
        System.out.println("After sending the test frame");
    }
    */
}
