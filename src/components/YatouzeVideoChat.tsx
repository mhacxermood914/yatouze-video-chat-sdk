/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-explicit-any */

import React, {useState, useEffect, useRef} from 'react'
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
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
        if(id !== 'localVideo'){
            const newElem = document.createElement('div')
            newElem.setAttribute('id', `div-${id}`)
            newElem.setAttribute('className', `w-[8rem] h-[8rem]`)
            // newElem.setAttribute('class', 'remoteVideo')
            newElem.innerHTML = "<video id="+id+" autoplay class='video'></video>"
            if(videoChatContainer?.current)videoChatContainer.current.appendChild(newElem)
    
            const vidElemnt:any = document.getElementById(id)
    
    
            console.log({vidElemnt})
        
            if(vidElemnt)vidElemnt.srcObject = stream
        }else{
            const htmlElement:any = document.getElementById('localVideo')

            htmlElement.srcObject = stream

        }
        
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
        <div  className='flex items-center h-screen'>
            <div className='w-3/4 rounded-xl mx-auto h-[35rem] shadow-xl'>
                <div className='p-6'>
                    <div className='flex items-center justify-between space-x-4'>
                        <div className='p-2 shadow-md w-[2rem] rounded-lg h-[2rem] flex justify-center items-center cursor-pointer'>
                            <IoIosArrowBack />
                        </div>
                        {/* new coming users */}
                        <div className='flex space-x-4 justify-between items-center flex-1  '>
                            <div className='flex flex-1 space-x-4  overflow-x-auto'>
                                <div className='h-[11rem] w-full bg-gray-400 rounded-lg'></div>
                                <div className='h-[11rem] w-full bg-gray-400 rounded-lg'></div>
                                <div className='h-[11rem] w-full bg-gray-400 rounded-lg'></div>
                            </div>
                                
                        </div>
                        <div className='p-2 shadow-md w-[2rem] rounded-lg h-[2rem] flex justify-center items-center cursor-pointer'>
                            <IoIosArrowForward />
                        </div>
                    </div>
                </div>
                <div className='px-[4.5rem]'>
                    <div  className='bg-gray-300 h-[19rem] w-full rounded-lg overflow-clip'>
                        <video id='localVideo' className='w-full h-full object-cover' autoPlay playsInline></video>
                    </div>
                </div>

            </div>
        </div>
    )
}