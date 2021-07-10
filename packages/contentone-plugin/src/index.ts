import { FlinkApp, FlinkPlugin, log } from "@flink-app/flink";
import got, { Response } from "got";
import FormData from 'form-data';
import fs from 'fs';

let baseUrl = "https://cdb.aquro.com";
let managementBaseUrl = "https://api.contentone.io";
export type ContentOneCollectionOptions = {
    id : string;
    client : ContentOneClient;


}

export type ContentOneOptions = {
  /**
   * Path for request 
   */
  baseUrl?: string;
  managementBaseUrl? : string

//  collections :  ContentOneCollectionOptions[]

  collections? : {[key:string] : ContentOneClient} 
  actions? : {[key:string] : ContentOneManagementAction} 
  cdns? : { [key:string] : ContentOneCDN}
  

};

interface ContentOneClientOptions {
  token: string;
  collection: string;
  debug?: boolean


}
  
  interface ContentOneResponse {
    status: "success" | "error";
    /**
     * Error message, if any.
     */
    message?: string;
  }
  
  interface ContentOneDocumentListResponse<T> extends ContentOneResponse {
    documents: T[];
  }
  
  interface ContentOneDocumentResponse<T> extends ContentOneResponse {
    document: T;
  }

  interface ContentOneRequestArguments {
      language? : string,
      environment? : "Production" | "Staging",
      resolve? : "yes" | "no"

  }

  interface ContentOneListRequestArguments extends ContentOneRequestArguments{
    skip? : number,
    limit? : number,
    sort? : string,
    sort_direction? : "asc" | "desc",
  }


  
  // TODO: Pagination
  export class ContentOneClient<DefaultType = any> {
    private token: string;
    private collection: string;
    private debug: boolean;
  
    constructor(options: ContentOneClientOptions) {
      this.token = options.token;
      this.debug = !!options.debug;
      this.collection = options.collection;
    }
  
    get<T = DefaultType>(id: string, options? : ContentOneRequestArguments): Promise<ContentOneDocumentResponse<T>> {
      return this.doRequest({
        contentOneOperation: "get",
        id,
        options
      });
    }
  
    list<T = DefaultType>(options? : ContentOneListRequestArguments): Promise<ContentOneDocumentListResponse<T>> {
      return this.doRequest({
        contentOneOperation: "list",
        options
      });
    }
  
    query<T = DefaultType>(queryName : string, query : {[key : string] : any }, options? : ContentOneListRequestArguments): Promise<ContentOneDocumentListResponse<T>> {
      return this.doRequest({
        contentOneOperation: "query",
        query : query,
        options,
        id : queryName
      });
    }
  
    private async doRequest({
      contentOneOperation,
      id = "",
      query = {},
      options = {}
    }: {
      contentOneOperation: "list" | "get" | "query";
      id?: string;
      query? : { [key : string] : any},
      options? : ContentOneListRequestArguments
    }) {
      try {
           let data = {...query, ...options, token : this.token};
           const response = <Response<any>>await got.post(`${baseUrl}/${contentOneOperation}/${this.collection}/${id}`, {
                json: true,
                body: data,                
            });

          

  
        this.logResponse(response);
  
        return response.body;
      } catch (error) {
        log.error(error);
      }
    }
  
    private logResponse(response: Response<any>) {
      if (this.debug) {
        log.json(response.statusCode, response.body);
      }
    }
  }

  

function getClient<T = any>(options : ContentOneClientOptions) : ContentOneClient{
    return new ContentOneClient<T>(options)
}


export const contentOnePlugin = (options: ContentOneOptions): FlinkPlugin => {


  return {
    id: "contentOne",
    ctx : {
        collections : options.collections || {},
        actions : options.actions || {},
        cdns : options.cdns || {},
        getClient : getClient,
        management : new ContentOneManagementClient(),
        cdnClient : new ContentOneCDNClient(),
        
    },
    init: (app) => init(app, options),
  };
};

function init(app: FlinkApp<any>, options: ContentOneOptions) {

  if(options.baseUrl!=null) baseUrl = options.baseUrl 
  if(options.managementBaseUrl!=null) managementBaseUrl = options.managementBaseUrl 
  

}

interface ContentOneManagementActionOptions{
  actionId : string, 
  apiKey : string,
}


interface ContentOneActionResponse<T = any>{
  status : "success" | "error",
  data : T
}

export class ContentOneManagementAction<DefaultType = any>{
  private client : ContentOneManagementClient;
  private actionId : string;
  private apiKey : string;

  constructor(options : ContentOneManagementActionOptions){
    this.client = new ContentOneManagementClient();
    this.actionId = options.actionId;
    this.apiKey = options.apiKey;
  }
  async execute<T = DefaultType>(args : any) : Promise<ContentOneActionResponse<T>>{
    return await this.client.action<T>(this.actionId, this.apiKey, args )
  }

}

class ContentOneManagementClient {
  
    constructor(){
   
    }

    async action<T = any>(actionId : string, apikey : string, args? : any) : Promise<ContentOneActionResponse<T>>{

      const data = {
        ActionID : actionId,
        APIKEY : apikey,
        Arguments : args
      }            
      const response = <Response<any>>await got.post(`${managementBaseUrl}/action/execute`, {
           json: true,
           body: data,           
       });

       return response.body;

    }
}

interface ContentOneCDNOptions{
  token : string
}
export class ContentOneCDN{
  private token : string;
  private client : ContentOneCDNClient;
  constructor(options : ContentOneCDNOptions){
    this.token = options.token;
    this.client = new ContentOneCDNClient();

  }

  async upload(path : string, options? : ContentOneUploadOptions ) : Promise<ContentOneUploadFileResponse>{
    return await this.client.upload(path, this.token, options);
  }
  
}
interface ContentOneUploadOptions{
  folderId? : string;
  image_rotate? : "90" | "180" | "270"  | "auto";
  image_resize_width? : number;
  image_resize_height? : number;
  image_resize_max? : "yes" | "no";
  image_resize_crop? : "center" | "attention";
  image_thumb? : "yes" | "no";
  image_thumb_width? : number,
  image_thumb_height? : number,

}

interface ContentOneUploadedFile{
  _id:string;
  ProjectID:string;
  Local_FileName:string;
  CDN_FileName:string;
  Url:string;
  Type:string;
  Size:number;
  CreatedDate:string;
  FolderID:string;
  Thumbnail? : string;
  ThumbnailCDN_Filename? : string;
}
interface ContentOneUploadFileResponse{
  status : "success" | "fail",
  file : ContentOneUploadedFile
}
export class ContentOneCDNClient{
  async upload(path : string, token : string,  options? : ContentOneUploadOptions ) : Promise<ContentOneUploadFileResponse>{

    if(options == null) options = {};
    
    

    const form = new FormData();

    form.append('File', fs.createReadStream(path));
    form.append('token', token);

    if(options.folderId != null) form.append('FolderID', options.folderId );
    if(options.image_rotate != null) form.append('image_rotate', options.image_rotate );
    if(options.image_resize_width != null) form.append('image_resize_width', options.image_resize_width );
    if(options.image_resize_height != null) form.append('image_resize_height', options.image_resize_height );
    if(options.image_resize_max != null) form.append('image_resize_max', options.image_resize_max );
    if(options.image_resize_crop != null) form.append('image_resize_crop', options.image_resize_crop );
    if(options.image_thumb != null) form.append('image_thumb', options.image_thumb );
    if(options.image_thumb_width != null) form.append('image_thumb_width', options.image_thumb_width );
    if(options.image_thumb_height != null) form.append('image_thumb_height', options.image_thumb_height );
    
    const response = <Response<any>> await got.post(managementBaseUrl + "/content/file/upload", {
      body: form
    });
    

    const body = JSON.parse(response.body)
    
    return({
      status : body.status,
      file : body.data?.File
    })




  }
}

export interface contentOnePluginContext{
  contentOne : {
        collections : {
          [key : string] : ContentOneClient
        },
        actions : {
          [key : string] : ContentOneManagementAction
        },
        cdns : {
          [key : string] : ContentOneCDN
        },     

        getClient<T = any>(options : ContentOneClientOptions) : ContentOneClient
        management : ContentOneManagementClient,
        cdnClient : ContentOneCDNClient
    }
}