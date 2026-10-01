export default {
  poweredByHeader:false,
  async rewrites(){return [
    {source:'/',destination:'/index.html'},
    {source:'/p/:id',destination:'/index.html'},
    {source:'/reset/:id',destination:'/index.html'}
  ]},
  async headers(){return [{source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'no-referrer'},
    {key:'X-Frame-Options',value:'DENY'}
  ]}]}
};
