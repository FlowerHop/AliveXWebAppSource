package bluetooth;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import javax.bluetooth.DeviceClass;
import javax.bluetooth.DiscoveryListener;
import javax.bluetooth.LocalDevice;
import javax.bluetooth.RemoteDevice;
import javax.bluetooth.ServiceRecord;
import javax.bluetooth.UUID;

public class BTService {

    private Object completedEvent;
    //private UUID HANDS_FREE = new UUID(0x111E);
    private UUID SERIAL_PORT = new UUID(0x1101);
    private UUID[] uuidSet = new UUID[] { SERIAL_PORT };
    private int[] attrIDs =  new int[] { 0x0100 };
    private ArrayList<RemoteDevice> remoteDevices;

    public ArrayList<HashMap<String, String>> listServiceBTDevices;

    public BTService(ArrayList<RemoteDevice> dev) {
        completedEvent = new Object();
        remoteDevices = new ArrayList<RemoteDevice>();
        listServiceBTDevices = new ArrayList<HashMap<String, String>>();
        remoteDevices = dev;
    }

    private void addItem(String name, String address, String url) {
        HashMap<String, String> item = new HashMap<String, String>();
        item.put("name", name);
        item.put("address", address);
        item.put("url", url);
        listServiceBTDevices.add(item);
    }

    public void getService() {
        try {
            /* Create an object of DiscoveryListener */
            DiscoveryListener listener = new DiscoveryListener() {
                /* To find blue-tooth devices */
                public void deviceDiscovered(RemoteDevice btDevice, DeviceClass cod) {
                }

                /* To find blue-tooth devices */
                public void inquiryCompleted(int discType) {
                }

                /* Find service URL of blue-tooth device */
                public void servicesDiscovered(int transID, ServiceRecord[] data) {
                    System.out.println("Find servicerecord");

                    for (int i = 0; i < data.length; i++) {
                        RemoteDevice btdevice = data[i].getHostDevice();
                        try {
                            String url = data[i].getConnectionURL(ServiceRecord.NOAUTHENTICATE_NOENCRYPT, false);
                            String btname = btdevice.getFriendlyName(false);
                            String btaddress = btdevice.getBluetoothAddress();
                            addItem(btname, btaddress, url);
                        } catch (IOException e) {
                            // TODO Auto-generated catch block
                            e.printStackTrace();
                        }

                    }
                }

                /* Notify thread when search completed */
                public void serviceSearchCompleted(int transID, int respCode) {
                    if (respCode == SERVICE_SEARCH_COMPLETED)
                        System.out.println("Services successfully located");
                    else if(respCode == SERVICE_SEARCH_TERMINATED)
                        System.out.println("Service inquiry was cancelled");
                    else if(respCode == SERVICE_SEARCH_DEVICE_NOT_REACHABLE)
                        System.out.println("Service connection cannot be established");
                    else if(respCode == SERVICE_SEARCH_NO_RECORDS)
                        System.out.println("No service found");
                    else
                        System.out.println("ERROR: service inquiry failed");

                    synchronized (completedEvent) {
                        completedEvent.notifyAll();
                    }
                }

            };

            for(int i = 0; i < remoteDevices.size(); i++) {
                /*String btname = remoteDevices.get(i).getFriendlyName(false);
                String btaddress = remoteDevices.get(i).getBluetoothAddress();
                addItem(btname, btaddress);*/

                synchronized (completedEvent) {
                    LocalDevice.getLocalDevice().getDiscoveryAgent().searchServices(attrIDs, uuidSet, remoteDevices.get(i), listener);
                    completedEvent.wait();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
