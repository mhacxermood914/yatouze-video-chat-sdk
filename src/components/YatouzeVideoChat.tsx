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
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        },
        { urls: "stun:stun.l.google.com:5349" },
        // { urls: "stun:stun1.l.google.com:3478" },
        // { urls: "stun:stun1.l.google.com:5349" },
        // { urls: "stun:stun2.l.google.com:19302" },
        // { urls: "stun:stun2.l.google.com:5349" },
        // { urls: "stun:stun3.l.google.com:3478" }
    ]

    const setupDeviceAndRTC = async ()=>{
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video:true, audio: true
        })
        if(localVideo.current)localVideo.current.srcObject= mediaStream;

        localStream = mediaStream

        rtcPeerConnection =new RTCPeerConnection({iceServers})

        // rtcPeerConnection.getSenders().forEach((sender:any) => rtcPeerConnection.removeTrack(sender));

        localStream.getTracks().forEach((track:any)=>{
            rtcPeerConnection.addTrack(track, localStream)
        })

        rtcPeerConnection.onconnectionstatechange=(event:any)=>{
            if(event.target.connectionState === "disconnected" || event.target.connectionState === "failed"){
                console.log({event})
                handleDisconnection()
            }
        }

        rtcPeerConnection.onicecandidate = function(event:any){
            if(event.candidate){
                console.log({event})
                socket.emit("candidate", event.candidate);
            }
        }

        rtcPeerConnection.oniceconnectionstatechange  = function(){
            console.log('ICE Connection State:', rtcPeerConnection.iceConnectionState);
        }

        rtcPeerConnection.onicecandidateerror = function(event:any) {
            console.error('ICE Candidate Error:', event);
        };

        rtcPeerConnection.ontrack = (ev:any) => {
            console.log({ev:ev.streams[0]})
        }

        socket.emit('join', {
            room: "main",
            name:generateUid(14)
        })

        // createOffer()
    }

    async function handleDisconnection() {
        console.log('Connection lost. Attempting to renegotiate...');
      
        // Close the existing connection
        if (rtcPeerConnection) {
            rtcPeerConnection.close();
            rtcPeerConnection = null;
        }
      
        // Recreate the peer connection and add local tracks
        await createPeerConnection('');
      
        // createOffer()
      }

    const createPeerConnection = async (memberId:any)=>{
        console.log({memberId})
        remoteStream = new MediaStream()
        remoteVideo.current.srcObject = remoteStream
        if(rtcPeerConnection){
            rtcPeerConnection.ontrack = (ev:any) => {
                console.log({ev:ev.streams[0]})
                ev.streams[0].getTracks().forEach((track:any)=>{
                    remoteStream.addTrack(track)
                })
                   
            };
        }
        
    }

    const createOffer = async ()=>{
        createPeerConnection(uid)
        const offer:any = await rtcPeerConnection.createOffer({offerToReceiveVideo:true,iceRestart: true})
        rtcPeerConnection.setLocalDescription(offer)
        socket.emit('offer',{
            offer,
            memberId: uid
        })
    }

    const createAnswer = async (offer:any)=>{
        createPeerConnection(uid)
        await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await rtcPeerConnection.createAnswer({offerToReceiveVideo:true})
        rtcPeerConnection.setLocalDescription(answer)
        socket.emit('answer',{
            answer
        })
    }

    const handleToggleCamera = async ()=>{
        const videoTrack:any = localStream.getTracks().find((tracks:any)=>tracks.kind === 'video')

        if(videoTrack.enabled){
            videoTrack.enabled = false
        }else{
            videoTrack.enabled = true
        }
    }

    const handleToggleMicro = async ()=>{
        const audioTrack:any = localStream.getTracks().find((tracks:any)=>tracks.kind === 'audio')

        if(audioTrack.enabled){
            audioTrack.enabled = false
        }else{
            audioTrack.enabled = true
        }
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
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        })


        socket.on('memberJoined', (data)=>{
            if(data.is_new_user){
                // pour gerer la renegociation en cas de deconnexion (cloture d'onglet ou reload de page) d'un des peers
                // actuellement je me base sur des event de la webRTC , on pourrais dans un futur proche gerer avec les websockets..
                // apres plusieurs teste les websockets seront beaucoup plus efficace , car l'emission de l'event disconnected par webRTC viens
                // parfois tardivement

                if(!rtcPeerConnection){
                    setupDeviceAndRTC()
                    createPeerConnection('')
                }
                createOffer()
            }
        })

        socket.on("getCandidate", (candidate) => {
            if(rtcPeerConnection){
                rtcPeerConnection.addIceCandidate(candidate)
            }
        
        });

        // return ()=> socket.disconnect()
    },[])

    return (
        <>
            <h1> Yatouze Video Chat</h1>
            <div id="videos">
                <video className="vid-player" ref={localVideo} autoPlay playsInline></video>
                <video className="vid-player" ref={remoteVideo} autoPlay playsInline></video>
            </div>
            <div>
                <button id="join" className="btn" onClick={()=>createOffer()}>Click to join</button>
                <button onClick={handleToggleCamera}>Toogle Camera</button>
                {/*<button>End Call</button>*/}
                <button onClick={handleToggleMicro}>Toogle Audio</button>
            </div>
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