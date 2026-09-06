import {handleGet,handlePost} from '@/lib/workspace-server';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>handleGet(request,'customer');
export const POST=async(request:Request)=>{const response=await handlePost(request,'customer');response.headers.set('Cache-Control','private, no-store');return response;};
