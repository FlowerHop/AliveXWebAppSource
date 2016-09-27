package bluetooth;

import java.io.IOException;
import java.util.ArrayList;
import javax.bluetooth.DeviceClass;
import javax.bluetooth.DiscoveryAgent;
import javax.bluetooth.DiscoveryListener;
import javax.bluetooth.LocalDevice;
import javax.bluetooth.RemoteDevice;
import javax.bluetooth.ServiceRecord;

public class BTDiscovery {

    private Object completedEvent;

    public ArrayList<RemoteDevice> remoteDevices;

    public BTDiscovery() {
        remoteDevices = new ArrayList<RemoteDevice>();
        completedEvent = new Object();
    }

    public void getDevices() {
        try {
            DiscoveryListener listener = new DiscoveryListener() {

                public void deviceDiscovered(RemoteDevice btDevice, DeviceClass cod) {
                    /* Get devices paired with system or in range(Without Pair) */
                    remoteDevices.add(btDevice);
                    try {
                        System.out.println(btDevice.getFriendlyName(false));
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }

                public void inquiryCompleted(int discType) {
                    /* Notify thread when inquiry completed */
                    System.out.println("Device Inquiry completed!");
                    synchronized (completedEvent) {
                        completedEvent.notifyAll();
                    }
                }

                /* To find service on blue-tooth */
                public void serviceSearchCompleted(int transID, int respCode) {
                }

                /* To find service on blue-tooth */
                public void servicesDiscovered(int transID, ServiceRecord[] servRecord) {
                }
            };

            synchronized (completedEvent) {
                /* Start device discovery */
                boolean started = LocalDevice.getLocalDevice().getDiscoveryAgent().startInquiry(DiscoveryAgent.GIAC, listener);

                if (started) {
                    System.out.println("Wait for device inquiry to complete");
                    completedEvent.wait();
                    System.out.println(remoteDevices.size() +  " device(s) found");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

}
