package bluetooth;

import java.awt.EventQueue;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.ArrayList;
import java.util.HashMap;
import javax.bluetooth.RemoteDevice;
import javax.swing.DefaultListModel;
import javax.swing.GroupLayout;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.UIManager;
import javax.swing.WindowConstants;
import javax.swing.event.ListSelectionEvent;
import javax.swing.event.ListSelectionListener;

public class BTActivity extends JFrame {

    public class BTDeviceSearch implements Runnable {

        public void run() {
            while(!cancelDiscovery) {
                startBTDiscovery();
                try {
                    discoverythread.sleep(1000);
                    System.out.println("\nSearch again");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private JList BTDevicesList;
    private JLabel stateLabel;
    private JLabel statehelpLabel;
    private JLabel helpLabel;
    private JButton connectButton;
    private JButton scanButton;
    private JScrollPane BTDevicesScrollPane;
    private DefaultListModel defaultModel;
    private Thread discoverythread;
    private Thread connectionthread;
    private boolean cancelDiscovery = false;
    private HashMap<String, String> mapURL;

    public BTActivity() {
        onCreate();
    }

    private void onCreate() {
        initUIComponent();

        /*addWindowListener(new WindowAdapter() {
            public void windowOpened(WindowEvent evt) {

            }
        });*/

        scanButton.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e) {
                scanButton.setEnabled(false);
                stateLabel.setText("Searching");
                discoverythread = new Thread(new BTDeviceSearch());
                discoverythread.start();
            }
        });

        BTDevicesList.addListSelectionListener(new ListSelectionListener() {
            public void valueChanged(ListSelectionEvent e) {
                if(!e.getValueIsAdjusting()) {
                    System.out.println("Listselectionlistener trigered");
                    listenConnection();
                }
            }
        });
    }

    private void onReceive(ArrayList<RemoteDevice> dev) {
        BTService mBTService = new BTService(dev);
        mBTService.getService();
        onUpdate(mBTService.listServiceBTDevices);
    }

    private void onUpdate(ArrayList<HashMap<String, String>> mlistSBTDevices) {
        System.out.println("Updating UI");
        defaultModel.clear();

        mapURL = new HashMap<String, String>();
        for(int i = 0; i < mlistSBTDevices.size(); i++) {
            defaultModel.addElement(mlistSBTDevices.get(i).get("name"));

            mapURL.put(mlistSBTDevices.get(i).get("name"),
                    mlistSBTDevices.get(i).get("url"));
        }
    }

    private void startBTDiscovery() {
        BTDiscovery mBTDiscovery = new BTDiscovery();
        mBTDiscovery.getDevices();
        onReceive(mBTDiscovery.remoteDevices);
    }

    private void listenConnection() {
        connectButton.setEnabled(true);

        connectButton.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e) {
                BTDevicesList.setEnabled(false);
                connectButton.setEnabled(false);
                cancelDiscovery = true;
                stateLabel.setText("Connected");

                String url = mapURL.get(BTDevicesList.getSelectedValue());
                System.out.println("ConnectionThread established");
                connectionthread = new Thread(new BTConnection(url));
                System.out.println("ConnectionThread runs and Handshaking is made");
                connectionthread.start();
            }
        });
    }

    private void initUIComponent() {
        BTDevicesList = new JList();
        stateLabel = new JLabel();
        statehelpLabel = new JLabel();
        helpLabel = new JLabel();
        connectButton = new JButton();
        scanButton = new JButton();
        BTDevicesScrollPane = new JScrollPane();
        defaultModel = new DefaultListModel();

        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        setTitle("Bluetooth Discovery");
        setResizable(false);
        setSize(350,220);
        setLocationRelativeTo(null);

        helpLabel.setText("Please choose a device to pair with");
        statehelpLabel.setText("State:");
        stateLabel.setText("Initial");
        connectButton.setText("Connect");
        scanButton.setText("Scan");
        Font font = new Font("Courier", Font.BOLD, 12);
        helpLabel.setFont(font);
        stateLabel.setFont(font);
        statehelpLabel.setFont(font);
        connectButton.setFont(font);
        scanButton.setFont(font);

        BTDevicesScrollPane.setViewportView(BTDevicesList);
        BTDevicesList.setModel(defaultModel);
        connectButton.setEnabled(false);

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(layout.createSequentialGroup()
                .addGap(10)
                .addGroup(layout.createParallelGroup()
                        .addComponent(helpLabel)
                        .addComponent(BTDevicesScrollPane, GroupLayout.PREFERRED_SIZE, 200, GroupLayout.PREFERRED_SIZE))
                .addGap(20)
                .addGroup(layout.createParallelGroup()
                        .addGroup(layout.createSequentialGroup()
                                .addGroup(layout.createParallelGroup()
                                        .addComponent(statehelpLabel))
                                .addGap(10)
                                .addGroup(layout.createParallelGroup()
                                        .addComponent(stateLabel)))
                        .addComponent(scanButton)
                        .addComponent(connectButton))
        );
        layout.setVerticalGroup(layout.createSequentialGroup()
                .addGap(10)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                        .addComponent(helpLabel))
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                        .addComponent(BTDevicesScrollPane)
                        .addGroup(layout.createSequentialGroup()
                                .addComponent(true, statehelpLabel)
                                .addGap(50)
                                .addComponent(scanButton)
                                .addGap(15)
                                .addComponent(connectButton))
                        .addComponent(stateLabel))
                .addGap(15)
        );
    }

    public static void main(String[] args) {
        JFrame.setDefaultLookAndFeelDecorated(true);
        try {
            UIManager.setLookAndFeel("com.sun.java.swing.plaf.windows.WindowsLookAndFeel");
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        EventQueue.invokeLater(new Runnable(){
            public void run() {
                BTActivity activity = new BTActivity();
                activity.setVisible(true);
            }
        });
    }
}
