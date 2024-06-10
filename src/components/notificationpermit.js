import React from "react";
import { useEffect } from "react";


export default function NotificationPermission(){

    useEffect(()=>{

        const requestPermission = async () => {
            try {
                const permission= await Notification.requestPermission();
                if(permission === 'granted') {
                    console.log("Notification permission granted")
                }
                else {
                    console.error("Notification not granted")
                }
            } catch (err) {
                console.error("Error requesting notification permission:", err);
            }
        };
  
        requestPermission();
}, []);

    return <div></div>;
};