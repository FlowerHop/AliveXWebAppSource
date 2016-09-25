# Alive Web App

This is an **Alive web app** that transformed from the **Alive android app**

## Code Refactoring

I have been trying to **transform** the original android app into a web app

## Problems that need to be solved

1. Android activity life cycle
2. The flow of the alive app
3. Codes organization
4. Differences between native language(android) and web language(javascript)
5. How to communicate with the **Alive** sensor device
6. Signal analysis(raw data and packet)
7. Internet protocols(frame)
8. Drawing too fast in the web browser(trying)

## Methods that I've used and found

1. The most important thing is to check whether the web browser
   has the **Corresponding API**
2. In order to support the **bluetooth API** with the web browser, we choose to
   set up a server(written in oracle java) to be a gateway and data that are collected by the sensor will be tranfered to the server through **Java Bluetooth API**
3. Now, our server(written in oracle java) can communicate or interact with the
   web browser through **WebSocket API**

## Reference

1. [UUID](http://bluecove.org/bluecove/apidocs/javax/bluetooth/UUID.html)
2. [RFC 6455](https://tools.ietf.org/html/rfc6455#section-5.2)
3. [WebSocket server side](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_a_WebSocket_server_in_Java)
4. [WebSocket client side](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#Sending_data_to_the_server)
5. [Bluetooth](http://www.bluecove.org/bluecove/apidocs/overview-summary.html)

by 2016/9/25
