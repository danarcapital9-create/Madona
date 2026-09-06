/** One canonical representation for Jordanian local and international mobile numbers. */
export function normalizePhone(input:unknown):string|null{
 if(typeof input!=='string'||input.length>40)return null;
 let value=input.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\s()\-\u200e\u200f]/g,'');
 if(value.startsWith('00'))value='+'+value.slice(2);
 if(/^07[789]\d{7}$/.test(value))value='+962'+value.slice(1);
 else if(/^7[789]\d{7}$/.test(value))value='+962'+value;
 else if(/^9627[789]\d{7}$/.test(value))value='+'+value;
 if(value.startsWith('+962')&&!/^\+9627[789]\d{7}$/.test(value))return null;
 return /^\+[1-9]\d{7,14}$/.test(value)?value:null;
}
