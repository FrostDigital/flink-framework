export interface ModuleList {
  modules: Module[];
}

export interface Module {
  id: string;
  type: string;
  features: string[];
  title: string;
  ui: string;
  //endpoints : ModuleEndpoint[]
}

// export interface ModuleEndpoint{
//     method : string,
//     url : string
// }
