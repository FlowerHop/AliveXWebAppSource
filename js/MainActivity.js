'use strict';

document.addEventListener('DOMContentLoaded', function (event) {
    // Do the background UI thread
    var todoecggridlines = new EcgGridlinesManager();
    todoecggridlines.start();

    // Bind service with main thread
    var todoaliveservice = new AliveServiceManager();
    todoaliveservice.start();
});
