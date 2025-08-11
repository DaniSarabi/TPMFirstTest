import{j as e}from"./app-CrM3bAr7.js";import{D as i,f as o,b as a,c as t,e as c,g as d}from"./dropdown-menu-D615tSEK.js";import{B as l}from"./button-DSYtEUz-.js";import{c as p}from"./createLucideIcon-BQ0uF5zu.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M20 7h-9",key:"3s1dr2"}],["path",{d:"M14 17H5",key:"gfn3mx"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]],m=p("Settings2",h);function w({table:n}){return e.jsxs(i,{children:[e.jsx(o,{asChild:!0,children:e.jsxs(l,{variant:"outline",size:"sm",className:"ml-auto hidden h-9 lg:flex drop-shadow-lg",children:[e.jsx(m,{className:"mr-2 h-4 w-4"}),"View"]})}),e.jsxs(a,{align:"end",className:"w-[150px]",children:[e.jsx(t,{children:"Toggle columns"}),e.jsx(c,{}),n.getAllColumns().filter(s=>typeof s.accessorFn<"u"&&s.getCanHide()).map(s=>e.jsx(d,{className:"capitalize",checked:s.getIsVisible(),onCheckedChange:r=>s.toggleVisibility(!!r),children:s.id},s.id))]})]})}export{w as D};
