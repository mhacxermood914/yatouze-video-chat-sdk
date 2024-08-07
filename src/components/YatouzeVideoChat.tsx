/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useRef } from "react"
// import socket from "../utils/socket"

// export default function YatouzeVideoChat(){

//     const localVideo: any = useRef(null)
//     const remoteVideo: any = useRef(null)
//     const uid:any = generateUid(12)
//     let rtcPeerConnection: any, remoteStream:any, localStream:any;
//     const iceServers:any= [
//         { urls: "stun:stun.l.google.com:19302" },
//         {
//             urls: 'turn:numb.viagenie.ca',
//             credential: 'muazkh',
//             username: 'webrtc@live.com'
//         },
//         { urls: "stun:stun.l.google.com:5349" },
//         // { urls: "stun:stun1.l.google.com:3478" },
//         // { urls: "stun:stun1.l.google.com:5349" },
//         // { urls: "stun:stun2.l.google.com:19302" },
//         // { urls: "stun:stun2.l.google.com:5349" },
//         // { urls: "stun:stun3.l.google.com:3478" }
//     ]

//     const setupDeviceAndRTC = async ()=>{
//         const mediaStream = await navigator.mediaDevices.getUserMedia({
//             video:true, audio: true
//         })
//         if(localVideo.current)localVideo.current.srcObject= mediaStream;

//         localStream = mediaStream

//         rtcPeerConnection =new RTCPeerConnection({iceServers})

//         // rtcPeerConnection.getSenders().forEach((sender:any) => rtcPeerConnection.removeTrack(sender));

//         localStream.getTracks().forEach((track:any)=>{
//             rtcPeerConnection.addTrack(track, localStream)
//         })

//         rtcPeerConnection.onconnectionstatechange=(event:any)=>{
//             if(event.target.connectionState === "disconnected" || event.target.connectionState === "failed"){
//                 console.log({event})
//                 handleDisconnection()
//             }
//         }

//         rtcPeerConnection.onicecandidate = function(event:any){
//             if(event.candidate){
//                 console.log({event})
//                 socket.emit("candidate", event.candidate);
//             }
//         }

//         rtcPeerConnection.oniceconnectionstatechange  = function(){
//             console.log('ICE Connection State:', rtcPeerConnection.iceConnectionState);
//         }

//         rtcPeerConnection.onicecandidateerror = function(event:any) {
//             console.error('ICE Candidate Error:', event);
//         };

//         rtcPeerConnection.ontrack = (ev:any) => {
//             console.log({ev:ev.streams[0]})
//         }

//         socket.emit('join', {
//             room: "main",
//             name:generateUid(14)
//         })

//         // createOffer()
//     }

//     async function handleDisconnection() {
//         console.log('Connection lost. Attempting to renegotiate...');
      
//         // Close the existing connection
//         if (rtcPeerConnection) {
//             rtcPeerConnection.close();
//             rtcPeerConnection = null;
//         }
      
//         // Recreate the peer connection and add local tracks
//         await createPeerConnection('');
      
//         // createOffer()
//       }

//     const createPeerConnection = async (memberId:any)=>{
//         console.log({memberId})
//         remoteStream = new MediaStream()
//         remoteVideo.current.srcObject = remoteStream
//         if(rtcPeerConnection){
//             rtcPeerConnection.ontrack = (ev:any) => {
//                 console.log({ev:ev.streams[0]})
//                 ev.streams[0].getTracks().forEach((track:any)=>{
//                     remoteStream.addTrack(track)
//                 })
                   
//             };
//         }
        
//     }

//     const createOffer = async ()=>{
//         createPeerConnection(uid)
//         const offer:any = await rtcPeerConnection.createOffer({offerToReceiveVideo:true,iceRestart: true})
//         rtcPeerConnection.setLocalDescription(offer)
//         socket.emit('offer',{
//             offer,
//             memberId: uid
//         })
//     }

//     const createAnswer = async (offer:any)=>{
//         createPeerConnection(uid)
//         await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer))
//         const answer = await rtcPeerConnection.createAnswer({offerToReceiveVideo:true})
//         rtcPeerConnection.setLocalDescription(answer)
//         socket.emit('answer',{
//             answer
//         })
//     }

//     const handleToggleCamera = async ()=>{
//         const videoTrack:any = localStream.getTracks().find((tracks:any)=>tracks.kind === 'video')

//         if(videoTrack.enabled){
//             videoTrack.enabled = false
//         }else{
//             videoTrack.enabled = true
//         }
//     }

//     const handleToggleMicro = async ()=>{
//         const audioTrack:any = localStream.getTracks().find((tracks:any)=>tracks.kind === 'audio')

//         if(audioTrack.enabled){
//             audioTrack.enabled = false
//         }else{
//             audioTrack.enabled = true
//         }
//     }


//     React.useEffect(()=>{
//         setupDeviceAndRTC()
//     },[])

//     React.useEffect(()=>{
//         socket.connect()
    
//         socket.on('getOffer', (data)=>{
//             console.log({data})
//             createAnswer(data.offer)
//         })

//         socket.on('getAnswer',(data)=>{
//             console.log({data})
//             rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
//         })


//         socket.on('memberJoined', (data)=>{
//             if(data.is_new_user){
//                 // pour gerer la renegociation en cas de deconnexion (cloture d'onglet ou reload de page) d'un des peers
//                 // actuellement je me base sur des event de la webRTC , on pourrais dans un futur proche gerer avec les websockets..
//                 // apres plusieurs teste les websockets seront beaucoup plus efficace , car l'emission de l'event disconnected par webRTC viens
//                 // parfois tardivement

//                 if(!rtcPeerConnection){
//                     setupDeviceAndRTC()
//                     createPeerConnection('')
//                 }
//                 createOffer()
//             }
//         })

//         socket.on("getCandidate", (candidate) => {
//             if(rtcPeerConnection){
//                 rtcPeerConnection.addIceCandidate(candidate)
//             }
        
//         });

//         // return ()=> socket.disconnect()
//     },[])

//     return (
//         <>
//             <h1> Yatouze Video Chat</h1>
//             <div id="videos">
//                 <video className="vid-player" ref={localVideo} autoPlay playsInline></video>
//                 <video className="vid-player" ref={remoteVideo} autoPlay playsInline></video>
//             </div>
//             <div>
//                 <button id="join" className="btn" onClick={()=>createOffer()}>Click to join</button>
//                 <button onClick={handleToggleCamera}>Toogle Camera</button>
//                 {/*<button>End Call</button>*/}
//                 <button onClick={handleToggleMicro}>Toogle Audio</button>
//             </div>
//         </>
//     )
// }

// function generateUid(length: any) {
//     const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let result = '';
//     for (let i = 0; i < length; i++) {
//         const randomIndex = Math.floor(Math.random() * characters.length);
//         result += characters[randomIndex];
//     }
//     return result;
// }

import React, {useState, useEffect, useRef} from 'react'
import socket from '../utils/socket'
import { Device } from 'mediasoup-client';

let params: any= {
    encoding:[
        {
            rid:'r0',
            maxBitRate: 100000,
            scalabilityMode:'S1T3'
        },
        {
            rid:'r1',
            maxBitRate: 300000,
            scalabilityMode:'S1T3'
        },
        {
            rid:'r2',
            maxBitRate: 900000,
            scalabilityMode:'S1T3'
        }
    ],
    codecOptions:{
        videoGoogleStartBitRate:1000
    }
};

export default function YatouzeVideoChat(){

    let localStream:any = null
    let [device, setDevice]: any = useState(null)
    let [rtpCapabilities, setRtpCapabilities]: any = useState(null)
    let existingProducers: any =[]
    let producers:any = []
    const videoChatContainer:any = useRef(null)

    const init = ()=>{
        joinRoom()
    }

    const addElements= (id: string,  stream: any)=>{
        const newElem = document.createElement('div')
        newElem.setAttribute('id', `div-${id}`)
        // newElem.setAttribute('class', 'remoteVideo')
        newElem.innerHTML = "<video id="+id+" autoplay class='video'></video>"
        if(videoChatContainer?.current)videoChatContainer.current.appendChild(newElem)

        const vidElemnt:any = document.getElementById(id)


        console.log({vidElemnt})
    
        if(vidElemnt)vidElemnt.srcObject = stream
        
    }

    const createSendTransport = async (transport: any)=>{
        console.log({transport, params})
        try {
            const producer = await transport.produce(params)
            console.log({producer})
        } catch (error) {
            console.log({error})
        }
    }
    

    const createDevice = async ()=>{
        device = new Device()
        console.log({rtpCapabilities})
        await device.load({routerRtpCapabilities:rtpCapabilities})
        console.log({"canProduce": device.canProduce('video')})
        if(device.canProduce('video')){
            // createSendTransport()
            socket.emit('createWebRtcTransport',{consumer:false} ,async (remoteTransportParams: { [x: string]: any; uuid: any; })=>{
                console.log({remoteTransportParams})
                const {uuid, ...params} = remoteTransportParams
                const localTransport = await device.createSendTransport({...params,iceServers:[
                    {'urls' : 'stun:stun1.l.google.com:19302'},
                    {
                        urls: 'turn:relay1.expressturn.com:3478',
                        credential: 'xaQMSAhkufhl53NW',
                        username: 'efZDXAYWZO2KVVVJTS'
                    }
                ]})
        
                localTransport.on("connect", async ({ dtlsParameters }: any, callback: () => void, errback: (arg0: unknown) => void) =>
                    {
                      // Signal local DTLS parameters to the server side transport.
    
                      try
                      {
                        socket.emit("transport-connect", {
                            dtlsParameters,
                            uuid
                        });
                    
                        // Tell the transport that parameters were transmitted.
                        callback();
                      }
                      catch (error)
                      {
                        // Tell the transport that something was wrong.
                        errback(error);
                      }
                });
                    
                localTransport.on('produce', (data:any)=>{
                    console.log('produce', {data, localStream})
                    addElements('localVideo',localStream)
                    socket.emit('transport-produce',{
                        kind: data.kind,
                        uuid,
                        rtpParameters: data.rtpParameters
                    },(params:any)=>{
                        console.log("emit transport produce",{params})
                    })
                })
                
                setDevice(device)
                createSendTransport(localTransport)
    
            })
        }else{
            console.log("Ne peu produire une telle stream")
        }
    }
    

    const getRtpCapabilities = async ()=>{
        socket.emit('getRouterRtpCapabilities', (data:any)=>{
            console.log({data})
            rtpCapabilities = data;
            createDevice()
        })
    }


    console.log({params})

    const getLocalMediaStream = async ()=>{
        const stream = await navigator.mediaDevices.getUserMedia({video:true})
        const videoTrack = stream.getVideoTracks()[0]
        localStream =stream
        params = {
            ...params,
            track: videoTrack
        }
    
        getRtpCapabilities()
        
    }



    const joinRoom = ()=>{
        socket.emit('joinRoom',{roomName: 'main'},()=>{
            console.log('Room joined successfully')
            getLocalMediaStream()
        })
    }

    const consumeProducersTracks = (producerId: any)=>{
        existingProducers.push(producerId)
        socket.emit('createWebRtcTransport',{consumer:true, producerId, rtpCapabilities:device.rtpCapabilities}, async (remoteTransportParams: { [x: string]: any; uuid: any; })=>{
            console.log("consumer",{remoteTransportParams})
    
            const {uuid, ...params}=remoteTransportParams
    
            console.log({uuid})
    
            // if(!remoteTransportParams.error){
                const consumerTransport = await device.createRecvTransport({...params,iceServers:[
                    {'urls' : 'stun:stun1.l.google.com:19302'},
                    {
                        urls: 'turn:relay1.expressturn.com:3478',
                        credential: 'xaQMSAhkufhl53NW',
                        username: 'efZDXAYWZO2KVVVJTS'
                    }
                ]})
    
                createRecvTransport(consumerTransport,producerId,uuid, device.rtpCapabilities)
    
                consumerTransport.on('connect', async ({dtlsParameters}: any, callback: () => void, errback: (arg0: unknown) => void)=>{
                    console.log({uuid})
                    try {
                        await socket.emit('transport-recv-connect',{
                            producerId,
                            uuid,
                            dtlsParameters: dtlsParameters
                        })
                        callback()
                    } catch (error) {
                        errback(error)
                    }
                })
        })
    }

    const createRecvTransport =  (transport: { consume: (arg0: { id: any; producerId: any; kind: any; rtpParameters: any; }) => any; id: any; }, remoteProducerId: string,uuid: any,rtpCapabilities: any)=>{
        socket.emit('consume',{
            producerId: remoteProducerId,
            uuid,
            rtpCapabilities
        }, async (params: { id: any; producerId: any; kind: any; rtpParameters: any; serverConsumerId: any; })=>{
            console.log({params})
            const consumer = await transport.consume({
                id: params.id,
                producerId: params.producerId,
                kind: params.kind,
                rtpParameters: params.rtpParameters
            })
    
            console.log(transport.id)
            socket.emit('consumer-resume',{consumerId:params.serverConsumerId},()=>{
                const {track} = consumer
                console.log({consumer, track})
        
                const media = new MediaStream([track])
        
                addElements(remoteProducerId,media)
            })
    
        })
    }

    socket.on('newuserjoined', (data)=>{
        console.log("new user joined",data)
    })
    
    
    
    socket.on('newproducer', (data)=>{
        console.log("new producer",{data})
        socket.emit('getProducers', (data: any)=>{
            console.log({data})
            producers = data.producers
            producers.forEach((element: any) => {
                if(!existingProducers.includes(element.producerId)){
                    consumeProducersTracks(element.producerId)
                }else{
                    console.log("already exists", element.producerId)
                }
            });
        })
    })
    
    
    
    useEffect(()=>{
        socket.connect()
    
        init()
    },[])

    return (
        <div ref={videoChatContainer} className='grid grid-cols-5'>

        </div>
    )
}