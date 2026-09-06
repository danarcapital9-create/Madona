/** Sample only active animation frames; idle throttling must not reduce clarity. */
export class RenderQuality {
 ratio:number;private slow=0;private fast=0;private budget=16.7;private refreshSamples=0;
 constructor(private maximum:number,initial:number,private learnRefresh=false){this.ratio=Math.min(maximum,initial);}
 sample(milliseconds:number){if(!Number.isFinite(milliseconds)||milliseconds<4)return false;
  if(this.learnRefresh&&milliseconds<12){this.refreshSamples++;if(this.refreshSamples>=12)this.budget=Math.min(this.budget,milliseconds<9.8?8.34:11.12);}
  this.slow=milliseconds>this.budget*1.38?this.slow+1:Math.max(0,this.slow-1);
  this.fast=milliseconds<this.budget*1.08?this.fast+1:0;
  const before=this.ratio;
  if(this.slow>=30){this.ratio=Math.max(Math.min(1.25,this.maximum),this.ratio-.25);this.slow=0;this.fast=0;}
  else if(this.fast>=150){this.ratio=Math.min(this.maximum,this.ratio+.25);this.fast=0;}
  return before!==this.ratio;
 }
}
