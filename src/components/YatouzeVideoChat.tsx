/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-explicit-any */

import {useState, useEffect, useRef} from 'react'
// import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import socket from '../utils/socket'
// import { io, Socket } from 'socket.io-client';
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
let device: any = null
let existingProducers: any =[]
let consumersTransport: any =[]
let localProducer:any
let localStream:any = null
let rtpCapabilities: any=null
let localTransport:any;
let uid:any;
// let socket:any = io('http://localhost:4000', {
//     transports: ['websocket', 'polling'], // WebSocket first, fallback to polling
//     withCredentials: true,
//     reconnectionAttempts: 1,  // Try to reconnect 5 times before giving up
//     reconnectionDelay: 1000,  // Wait 1 second before each reconnection attempt
//     timeout: 20000, // Set a timeout for connection
// });
socket.connect()
export default function YatouzeVideoChat(){

    
   
    let producers:any = [], 
    consumers:any = [],
    consumerLength:any, 
    [consumersVideos, setConsumersVideos]: any =useState([])
    let ref:any =useRef(false)
    let [videoElements, setVideoElements]:any = useState([])
    // let [refresh, setRefresh] = useState(false)
    let [localProducerId, setLocalProducerId]:any =useState('')
    const videoChatContainer:any = useRef(null)

    const init = ()=>{
        joinRoom()
    }
    console.log({localProducerId, uid,consumerLength})
    const addElements= (id: string,  stream: any)=>{
        if(id !== 'localVideo'){
            console.log(!document.getElementById(`div-${id}`))
            if(!document.getElementById(`div-${id}`)){
                const newElem = document.createElement('div')
                newElem.setAttribute('id', `div-${id}`)
                newElem.style.height='11rem' //setAttribute('className', `h-[11rem] w-full bg-gray-400 rounded-lg`)
                newElem.style.width = '100%'
                newElem.style.overflow= 'hidden'
                newElem.style.borderRadius='13px'
                // newElem.setAttribute('class', 'remoteVideo')
                const vidElement = document.createElement('video')
                vidElement.setAttribute('id',`${id}`)
                vidElement.style.height="100%"
                vidElement.style.width="100%"
                vidElement.style.objectFit='cover' //setAttribute('className',`w-full h-full object-cover`)
                vidElement.autoplay = true
                vidElement.srcObject = stream
                newElem.appendChild(vidElement)
                // if(videoChatContainer?.current)videoChatContainer.current.appendChild(newElem)
        
                const vidElemnt:any = document.getElementById(id)
        
        
                console.log({vidElemnt})
                
                return newElem
            }
            // if(vidElemnt){
                

                // console.log({vidElemnt})

                
            // }
        }else{
            const htmlElement:any = document.getElementById('localVideo')

            htmlElement.srcObject = stream

        }
        
    }

    
    // console.log({ref,consumersVideos})
    useEffect(()=>{
        console.log({ref,consumersVideos})
        // if(!ref.current){
        //     console.log('true')
        //     ref.current = true
        //     return;
        // }

        if(consumersVideos.length){
            console.log('true facts')
            let elements:any = (consumersVideos.map((el:any)=>addElements(el.producerId,el.media))).filter((el:any)=>el)
            console.log({elements})
            
            setVideoElements((prev:any)=>{
                console.log({prev})
                return [...elements]
            })
        }
    },[consumersVideos])

    useEffect(()=>{
        if(videoChatContainer.current){
            // videoChatContainer.current.innerHtml=''
            console.log({videoElements})

            // setTimeout(()=>{
                videoElements.forEach((el:any)=>{
                    console.log(el.getAttribute('id'))
                    if(!document.getElementById(el.getAttribute('id'))){
                        videoChatContainer.current.appendChild(el)
                    }
                })
            // },5000)
        }
    },[videoElements])

    const createSendTransport = async (transport: any)=>{
        console.log({transport, params})
        try {
            const producer = await transport.produce(params)

            localProducer = producer

            console.log("tester", producer)

        } catch (error) {
            console.log({error})
        }
    }

    // function stopVideoOnly() {
    //     console.log(localProducerId)
    //     socket.emit('producer-paused', {producerId:localProducerId}, (data: any)=>{
    //         console.log({data})
    //     })
    //     // console.log({localStream})
    //     // localStream.getTracks().forEach((track: { readyState: string; kind: string; stop: () => void; }) => {
    //     //     if (track.readyState == 'live' && track.kind === 'video') {
    //     //         track.stop();
    //     //     }
    //     // });
    // }
    
    

    const createDevice = async ()=>{
        device = new Device()
        console.log({rtpCapabilities,device})
        await device.load({routerRtpCapabilities:rtpCapabilities})
        console.log({"canProduce": device.canProduce('video')})
        if(device.canProduce('video')){
            // createSendTransport()
            socket.emit('createWebRtcTransport',{consumer:false} ,async (remoteTransportParams: { [x: string]: any; uuid: any; })=>{
                console.log({remoteTransportParams})
                const {uuid, ...params} = remoteTransportParams
                uid = uuid 
                localTransport = await device.createSendTransport({...params,iceServers:[
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
                    
                localTransport.on('produce', (data:any,callback:any,errback:any)=>{
                    console.log('produce', {data, localStream,callback,errback})
                    addElements('localVideo',localStream)
                    socket.emit('transport-produce',{
                        kind: data.kind,
                        uuid,
                        rtpParameters: data.rtpParameters
                    },(params:any)=>{
                        // gerer les erreurs plus tars
                        console.log("emit transport produce",{params})
                        setLocalProducerId(params.id)
                        callback({ id:params.id });
                        if(params.producers.length){
                            loopTroughProducers(params?.producers)
                        }
                    })
                })
                
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

    console.log({params, consumersVideos})

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
        // existingProducers.push(producerId)
        console.log("consumer",{device,existingProducers})
        socket.emit('createWebRtcTransport',{consumer:true, producerId, rtpCapabilities:device.rtpCapabilities}, async (remoteTransportParams: { [x: string]: any; uuid: any; })=>{
            console.log("consumer",{remoteTransportParams})
    
            const {uuid, ...params}=remoteTransportParams
    
            console.log({uuid,device})
    
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
                        socket.emit('transport-recv-connect',{
                            producerId,
                            uuid,
                            dtlsParameters: dtlsParameters
                        })
                        callback()
                    } catch (error) {
                        errback(error)
                    }
                })

                // console.log({consumers})
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

                setConsumersVideos((prev:any)=>[...prev,{
                    producerId:params.producerId,
                    media,
                    serverConsumerId: params.serverConsumerId
                }])

                consumers.push({
                    producerId:params.producerId,
                    media,
                    serverConsumerId: params.serverConsumerId
                })

                consumersTransport = [
                    ...consumersTransport,
                    {
                        producerId: params.producerId,
                        serverConsumerId: params.serverConsumerId,
                        consumerTransport: transport,
                        consumer
                    }
                ]

                console.log({consumers})

                existingProducers.push(params.producerId)

                existingProducers = Array.from(new Set(existingProducers))

                // if(consumers.length === consumerLength){
                //     console.log({consumerLength})
                    // test.current= consumers
                    // setTimeout(()=>{
                    //     console.log('test')
                        // setConsumersVideos(consumers)
                    // },4000)
                // }

                // setTimeout(()=>{
                //     setRefresh(!refresh)
                // },4000)

        
                // addElements(remoteProducerId,media)
            })
    
        })
    }

    socket.on('newuserjoined', (data: any)=>{
        console.log("new user joined",data)
    })

    // useEffect(()=>{
    //     console.log({test})
    // },[test])

    const loopTroughProducers = (producers:any)=>{
        producers.forEach((element: any) => {
            console.log("checking",{existingProducers})
            if(!existingProducers.includes(element.producerId)){
                consumeProducersTracks(element.producerId)
            }else{
                console.log("already exists", element.producerId)
            }
        });
    }
    
    const stopTracks = async (producerId: string)=>{
        console.log({producerId})
        await localProducer.pause()
        // const vid:any = document.getElementById(producerId)!;
        // const tracks = vid.srcObject.getTracks();

        // tracks.forEach((track:any) => {
        //     track.enabled=false;
        // });

        // vid.srcObject = null;
    }

    const shareScreen = async ()=>{
        const stream = await navigator.mediaDevices.getDisplayMedia()
        const videoTrack = stream.getVideoTracks()[0]

        const localVideo :any =document.getElementById('localVideo')

        localVideo.srcObject = stream

        videoTrack.onended = async ()=>{
            console.log('stop sharing', localStream)
            const stream = await navigator.mediaDevices.getUserMedia({video:true})
            const newVideoTracks = stream.getVideoTracks()[0]
            console.log({newVideoTracks})

            localVideo.srcObject = stream

            await localProducer.replaceTrack({track: newVideoTracks})
            return
        }

        console.log({localProducer})
        await localProducer.replaceTrack({ track: videoTrack });


        console.log({videoTrack})
    }



    const resumeVideoOnly = async ()=>{
        await localProducer.resume()
        // socket.emit('producer-resumed',{producerId:localProducerId}, (data:any)=>{
        //     console.log({data})

        // })
    }
    
    
    
    
    
    
    useEffect(()=>{
        // socket.on('connect',(socket:any)=>{
        //     console.log('socket',socket)
        //     init()
        // })
        // console.log('ok cool')
        init()

        socket.on('newproducer', (data: any)=>{
            console.log("new producer",{data})
            ref.current = false
            socket.emit('getProducers', (data: any)=>{
                console.log({data})
                producers = data.producers
                consumerLength = producers.length
                console.log({existingProducers})
                loopTroughProducers(producers)
            })
        })

        socket.on('producer-closed', ({ producerId }) => {
            console.log({producerId, consumers, consumersTransport})
            // je close le consumer coté client ainsi que les transports associé
            const producerToClose = consumersTransport.find((transportData:any) => transportData.producerId === producerId)
            producerToClose.consumerTransport.close()
            producerToClose.consumer.close()
            existingProducers = existingProducers.filter((el:any)=>el!==producerId)
          
            // je remove le consumer transport de la liste
            consumersTransport = consumersTransport.filter((transportData:any) => transportData.producerId !== producerId)
          
            // je remove la video tags du DOM
            videoChatContainer.current.removeChild(document.getElementById(`div-${producerId}`))
          })

          socket.on('producer-paused', async({producerId})=>{
            console.log({producerId})
            const {consumer} = consumersTransport.find((el:any)=>el.producerId == producerId)
            console.log({consumer})
            await consumer.pause()

            if(document && producerId){
                stopTracks(producerId)
            }


            // console.log({data})
            // const {track} = data

            // console.log({track})

          })

          socket.on('producer-resumed', async({producerId,consumer})=>{
            console.log({producerId, consumer})
            // const {consumer,serverConsumerId} = consumersTransport.find((el:any)=>el.producerId == producerId)
            // socket.emit('consumer-resume',{consumerId:serverConsumerId},(data:any)=>{
            //     console.log({data})
            //     const {track} = data.consumer
            //     console.log({consumer, track})
        
            //     // const media = new MediaStream([track])

            //     // const vid:any = document.getElementById(producerId)!;
            //     // vid.srcObject = media


            //     // if(consumers.length === consumerLength){
            //     //     console.log({consumerLength})
            //         // test.current= consumers
            //         // setTimeout(()=>{
            //         //     console.log('test')
            //             // setConsumersVideos(consumers)
            //         // },4000)
            //     // }

            //     // setTimeout(()=>{
            //     //     setRefresh(!refresh)
            //     // },4000)

        
            //     // addElements(remoteProducerId,media)
            // })
            // console.log({consumer})
            // await consumer.resume()

            // const {track} = consumer
            //     console.log({consumer, track})
        
            //     const media = new MediaStream([track])
            //     console.log({media})
            //     const vid:any = document.getElementById(producerId)!;
            //     vid.srcObject = media

            // if(document && producerId){
            //     stopTracks(producerId)
            // }


            // console.log({data})
            // const {track} = data

            // console.log({track})

          })
        

        return ()=> socket?.disconnect()
    },[])

    return (
        <div  className='flex items-center h-screen'>
            <div className='w-3/4 rounded-xl mx-auto h-[35rem] shadow-xl'>
                <div className='p-6'>
                    <div className='flex items-center justify-between space-x-4'>
                        <div className='p-2 shadow-md w-[2rem] rounded-lg h-[2rem] flex justify-center items-center cursor-pointer'>
                            {/*<IoIosArrowBack />*/}
                        </div>
                        {/* new coming users */}
                        <div className='flex space-x-4 justify-between items-center flex-1  '>
                            <div ref={videoChatContainer} className='flex flex-1 space-x-4  overflow-x-auto'>
                                {/* <div className='h-[11rem] w-full bg-gray-400 rounded-lg'></div>
                                <div className='h-[11rem] w-full bg-gray-400 rounded-lg'></div> */}
                            </div>
                                
                        </div>
                        <div className='p-2 shadow-md w-[2rem] rounded-lg h-[2rem] flex justify-center items-center cursor-pointer'>
                            {/*<IoIosArrowForward />*/}
                        </div>
                    </div>
                </div>
                <div className='px-[4.5rem]'>
                    <div  className='bg-gray-300 h-[19rem] w-full rounded-lg overflow-clip'>
                        <video id='localVideo' className='w-full h-full object-cover' autoPlay playsInline></video>
                    </div>
                </div>
                <button onClick={()=>stopTracks('')}>Stop camera</button>
                <button onClick={()=>resumeVideoOnly()}>Resume camera</button>
                <button onClick={()=>shareScreen()}>Share Screen</button>
            </div>
        </div>
    )
}