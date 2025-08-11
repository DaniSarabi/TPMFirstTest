import{c as d}from"./createLucideIcon-BQ0uF5zu.js";import{j as s}from"./app-CrM3bAr7.js";import{c as m}from"./utils-jAU0Cazi.js";import{B as t}from"./button-DSYtEUz-.js";import{C as h}from"./chevrons-up-down-CqP_Vf3P.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],x=d("ArrowDown",r);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],w=d("ArrowUp",f);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]],C=d("Ellipsis",j);function D({column:i,title:l,className:o,onSort:a,currentSort:e}){if(!i.getCanSort())return s.jsx("div",{className:m(o),children:l});const c=(e==null?void 0:e.id)===i.id,n=c&&(e==null?void 0:e.desc),p=()=>{c?n?a(i.id,null):a(i.id,"desc"):a(i.id,"asc")};return s.jsx("div",{className:m("flex items-center gap-2",o),children:s.jsxs(t,{variant:"ghost",size:"sm",className:"-ml-3 h-8 data-[state=open]:bg-accent uppercase font-bold text-md tracking-wider",onClick:p,children:[s.jsx("span",{children:l}),n?s.jsx(x,{className:"ml-2 h-4 w-4"}):c?s.jsx(w,{className:"ml-2 h-4 w-4"}):s.jsx(h,{className:"ml-2 h-4 w-4"})]})})}export{D,C as E};
