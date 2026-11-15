import {z} from './index';
export const question=z.strictObject({id:z.string().min(1).max(80),label:z.string().trim().min(1).max(120),hint:z.string().max(200).default(''),type:z.enum(['short','long','single','multi','portfolio','contact']),required:z.boolean(),options:z.array(z.string().trim().min(1).max(100)).max(20).default([]),fixed:z.enum(['name','contact']).optional()});
export const questionnaire=z.strictObject({questions:z.array(question).min(2).max(30)}).superRefine((v,c)=>{
 const ids=new Set<string>();for(const [i,q]of v.questions.entries()){if(ids.has(q.id))c.addIssue({code:'custom',message:'题目ID不能重复',path:['questions',i,'id']});ids.add(q.id);if((q.type==='single'||q.type==='multi')&&(q.options.length<1||new Set(q.options).size!==q.options.length))c.addIssue({code:'custom',message:'选项需1～20项且不能重复',path:['questions',i,'options']});}
 for(const fixed of ['name','contact']as const){const qs=v.questions.filter(q=>q.fixed===fixed);if(qs.length!==1||!qs[0].required||qs[0].id!==(fixed==='name'?'q1':'q8')||qs[0].type!==(fixed==='name'?'short':'contact'))c.addIssue({code:'custom',message:'称呼和联系方式必须各有一个固定必填题，不能删除或改类型'});}
 for(const [i,q]of v.questions.entries()){if(q.type==='contact'&&q.fixed!=='contact')c.addIssue({code:'custom',message:'联系方式题仅允许保留固定身份项',path:['questions',i]});if(!['single','multi'].includes(q.type)&&q.options.length)c.addIssue({code:'custom',message:'此题型不支持选项',path:['questions',i,'options']});}
 if(v.questions.filter(q=>q.type==='portfolio').length>1)c.addIssue({code:'custom',message:'只能保留一个作品选择区'});
});
export const profile=z.strictObject({name:z.string().trim().min(1).max(80),description:z.string().max(2000),wechat:z.string().trim().max(100),quotaDefault:z.number().int().min(1).max(300)});
export const packageItem=z.strictObject({id:z.string().min(1).max(80),name:z.string().trim().min(1).max(80),price:z.string().max(200),quota:z.number().int().min(1).max(300),description:z.string().max(2000)});
export const content=z.strictObject({packages:z.array(packageItem).max(30),faq:z.array(z.strictObject({id:z.string().min(1).max(80),question:z.string().trim().min(1).max(200),answer:z.string().trim().min(1).max(4000)})).max(50)}).superRefine((v,c)=>{for(const items of [v.packages,v.faq])if(new Set(items.map(x=>x.id)).size!==items.length)c.addIssue({code:'custom',message:'ID不能重复'});});
export type Question=z.infer<typeof question>;
export type Questionnaire=z.infer<typeof questionnaire>;
export type Profile=z.infer<typeof profile>;
export type Content=z.infer<typeof content>;
export const defaultQuestionnaire:Questionnaire={questions:[
 {id:'q1',label:'怎么称呼你？',hint:'方便摄影师与你沟通',type:'short',required:true,options:[],fixed:'name'},
 {id:'q2',label:'想拍什么类型的照片？',hint:'选择其他可补充说明',type:'single',required:true,options:['个人写真','情侣','亲子','家庭','商业形象','其他']},
 {id:'q3',label:'你的预算范围',hint:'价格以双方最终约定为准',type:'single',required:false,options:['1000以下','1000～3000','3000～6000','6000以上','还没想好']},
 {id:'q4',label:'大概什么时候拍摄？',hint:'具体日期与时段在下方表达意向',type:'single',required:false,options:['一个月内','三个月内','半年内','还没定']},
 {id:'q5',label:'挑选你喜欢的作品（最多15张）',hint:'可跨作品组选择',type:'portfolio',required:false,options:[]},
 {id:'q6',label:'你最在意哪些方面？',hint:'可以多选',type:'multi',required:false,options:['自然抓拍','妆造服装','修图程度','场景氛围','出片速度','价格']},
 {id:'q7',label:'想避免什么情况？',hint:'例如过度修图、固定摆拍，可直接告诉摄影师',type:'long',required:false,options:[]},
 {id:'q8',label:'如何联系你？',hint:'微信用于沟通，四位访问码用于之后的项目访问',type:'contact',required:true,options:[],fixed:'contact'}]};
export const defaults=(name:string)=>({profile:{name,description:'用照片，留住值得纪念的时刻。',wechat:'',quotaDefault:10},questionnaire:defaultQuestionnaire,content:{packages:[],faq:[]},portfolio:defaultPortfolio});
export const portfolio=z.strictObject({showSamples:z.boolean(),groups:z.array(z.strictObject({id:z.string().min(1).max(80),name:z.string().trim().min(1).max(80)})).max(20)}).superRefine((v,c)=>{if(new Set(v.groups.map(x=>x.id)).size!==v.groups.length)c.addIssue({code:'custom',message:'作品组ID不能重复'});});
export type Portfolio=z.infer<typeof portfolio>;
export const defaultPortfolio:Portfolio={showSamples:true,groups:[{id:'portraits',name:'人像'},{id:'couples',name:'情侣'},{id:'families',name:'家庭'},{id:'moments',name:'纪实'},{id:'commercial',name:'商业形象'}]};

export const configSchemas={profile,questionnaire,content,portfolio};
