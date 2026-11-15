import type { NextConfig } from "next";
import path from "node:path";
const config:NextConfig={logging:false,reactCompiler:false,devIndicators:false,distDir:process.env.PROOFROOM_WEB_DIST??".next",turbopack:{root:path.resolve(__dirname,"../..")},transpilePackages:["@proofroom/contracts"],async rewrites(){return [{source:"/api/v1/:path*",destination:`${process.env.API_ORIGIN??"http://127.0.0.1:18182"}/api/v1/:path*`}]},async headers(){return [{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Frame-Options",value:"DENY"}]}]}};
export default config;
