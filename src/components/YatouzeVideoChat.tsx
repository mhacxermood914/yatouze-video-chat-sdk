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
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" }
    ]

    const setupDeviceAndRTC = async ()=>{
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video:true, audio: false
        })
        if(localVideo.current)localVideo.current.srcObject= mediaStream;

        localStream = mediaStream

        rtcPeerConnection =new RTCPeerConnection({iceServers})

        localStream.getTracks().forEach((track:any)=>{
            rtcPeerConnection.addTrack(track, localStream)
        })

        rtcPeerConnection.onconnectionstatechange=(event:any)=>{
            console.log({event})
        }

        rtcPeerConnection.onicecandidate = function(event:any){
            if(event.candidate){
                console.log({event})
                socket.emit("candidate", event.candidate);
            }
        }

        rtcPeerConnection.ontrack = (ev:any) => {
            console.log({ev:ev.streams[0]})
        }


    }

    const createPeerConnection = async (memberId:any)=>{
        console.log({memberId})
        remoteStream = new MediaStream()
        remoteVideo.current.srcObject = remoteStream

        rtcPeerConnection.ontrack = (ev:any) => {
            console.log({ev:ev.streams[0]})
            ev.streams[0].getTracks().forEach((track:any)=>{
                remoteStream.addTrack(track)
            })
               
        };
        
    }

    const createOffer = async ()=>{
        createPeerConnection(uid)
        const offer:any = await rtcPeerConnection.createOffer({offerToReceiveVideo:true})
        rtcPeerConnection.setLocalDescription(offer)
        socket.emit('offer',{
            offer,
            memberId: uid
        })
    }

    const createAnswer = async (offer:any)=>{
        createPeerConnection(uid)
        await rtcPeerConnection.setRemoteDescription(offer)
        const answer = await rtcPeerConnection.createAnswer({offerToReceiveVideo:true})
        rtcPeerConnection.setLocalDescription(answer)
        socket.emit('answer',{
            answer
        })
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
            if(rtcPeerConnection){
                rtcPeerConnection.addIceCandidate(candidate)
            }
        
        });

        return ()=> socket.disconnect()
    },[])

    return (
        <>
            <h1> Yatouze Video Chat</h1>
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