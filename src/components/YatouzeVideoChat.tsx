/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef } from "react"
import socket from "../utils/socket"

export default function YatouzeVideoChat(){

    const localVideo: any = useRef(null)
    const remoteVideo: any = useRef(null)
    const uid:any = generateUid(12)
    let rtcPeerConnection: any, remoteStream:any, localStream:any;
    const iceServers:any= [
        { urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"] }  
    ]

    const setupDeviceAndRTC = async ()=>{
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video:true, audio: false
        })
        if(localVideo.current)localVideo.current.srcObject= mediaStream;

        rtcPeerConnection =new RTCPeerConnection(iceServers)

        rtcPeerConnection.onaddstream= (event:any)=>{
            console.log({event})
        }

        rtcPeerConnection.addEventListener('connectionstatechange', (event:any)=>{
            console.log({event})
        })

        rtcPeerConnection.onicecandidate = function(event:any){
            if(event.candidate){
                // console.log("ice candidate", event.candidate)
                socket.emit("candidate", event.candidate);
            }
        }


    }

    const createPeerConnection = async (memberId:any)=>{
        console.log({memberId})
        remoteStream = new MediaStream()
        remoteVideo.current.srcObject = remoteStream


        localStream.getTracks().forEach((track:any)=>{
            rtcPeerConnection.addTrack(track, localStream)
        })
    }

    const createOffer = async ()=>{
        console.log({rtcPeerConnection})
        const offer:any = await rtcPeerConnection.createOffer({offerToReceiveVideo:true})



        rtcPeerConnection.setLocalDescription(offer)

        socket.emit('offer',{
            offer,
            memberId: uid
        })

        console.log({offer})
    }

    const createAnswer = async (offer:any)=>{
        await rtcPeerConnection.setRemoteDescription(offer)
        const answer = await rtcPeerConnection.createAnswer({offerToReceiveVideo:true})
        rtcPeerConnection.setLocalDescription(answer)

        socket.emit('answer',{
            answer
        })

        console.log({rtcPeerConnection})
    }


    React.useEffect(()=>{
        setupDeviceAndRTC()
    },[])

    React.useEffect(()=>{
        socket.connect()

        socket.on('getOffer', (data)=>{
            console.log({data})
            createAnswer(data.offer)
        })

        socket.on('getAnswer',(data)=>{
            console.log({data})
            rtcPeerConnection.setRemoteDescription(data.answer)
        })

        socket.on("getCandidate", (candidate) => {

            console.log("state",rtcPeerConnection)
        
            if(rtcPeerConnection){
                rtcPeerConnection.addIceCandidate(candidate)
            }
        
        });

        return ()=> socket.disconnect()
    },[])

    return (
        <>
            <h1>Video Chat</h1>
            <div id="videos">
                <video className="vid-player" ref={localVideo} autoPlay playsInline></video>
                <video className="vid-player" ref={remoteVideo} autoPlay playsInline></video>
            </div>
            <button id="join" className="btn" onClick={()=>createOffer()}>Click to join</button>
        </>
    )
}

function generateUid(length: any) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}