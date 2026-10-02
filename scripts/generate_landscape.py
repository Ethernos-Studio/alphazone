#!/usr/bin/env python3
"""Original, deterministic Alpha Zone key art. No downloaded or generated assets.

Run: uv run --with pillow --with numpy python scripts/generate_landscape.py
A voxel-space heightfield renderer, physically oriented surface shading, aerial
perspective, and perspective-projected, material-textured concrete architecture.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def noise(x, z, scale=1, seed=0):
    x = np.asarray(x) / scale; z = np.asarray(z) / scale
    ix = np.floor(x); iz = np.floor(z)
    fx = x - ix; fz = z - iz
    fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz)
    def h(a,b):
        p = np.sin(a*127.1 + b*311.7 + seed*17.91)*43758.5453123
        return p-np.floor(p)
    return ((h(ix,iz)*(1-fx)+h(ix+1,iz)*fx)*(1-fz)
            +(h(ix,iz+1)*(1-fx)+h(ix+1,iz+1)*fx)*fz)


def height(x,z):
    # A glacial valley, flanked by folded, fractured mountain massifs.
    bend = 60 + 170*np.sin(np.asarray(z)/1400)
    flank = 1-np.exp(-((x-bend)/(270+np.asarray(z)*.075))**2)
    far = np.clip((np.asarray(z)-1450)/2200,0,1)
    large = noise(x,z,1600,4)*.58+noise(x,z,690,8)*.42
    ridges = 1-abs(noise(x+noise(x,z,800,2)*270,z,370,3)*2-1)
    mountain = flank*far*(100+large*625+ridges*200)
    mountain += flank*far*(1-abs(noise(x,z,145,12)*2-1))*65
    mountain += np.exp(-((np.asarray(z)-6800)/1350)**2)*(210+noise(x,z,840,31)*510)
    detail = np.zeros_like(np.asarray(x),dtype=float)
    for scale,amp in [(180,48),(81,24),(36,12),(16,6),(6.5,2.6),(2.4,.85)]:
        detail += (noise(x,z,scale,7)-.48)*amp
    rolling = 17*np.sin(np.asarray(z)/175)+27*noise(x,z,270,11)
    # A rocky foreground shoulder anchors the relay installation.
    shoulder = 47*np.exp(-((x-240)/250)**2-((np.asarray(z)-650)/440)**2)
    crags=np.maximum(noise(x,z,18,27)-.56,0)**1.2*22
    near=np.clip((850-np.asarray(z))/700,0,1)
    rockfield=np.maximum(noise(x,z,86,24)-.35,0)*near
    return mountain+detail*(.35+flank*.75)+rolling+shoulder+crags*rockfield*3


def render(width,height_px,seed,steps):
    rng=np.random.default_rng(seed)
    W,H=width,height_px
    focal=W*.64; horizon=H*.55; eye=92.
    def project(p):
        x,y,z=p
        return (W/2+x/z*focal,horizon-(y-eye)/z*focal)
    # Cold, overcast sky with broad low-contrast cloud fields, never a white void.
    X,Y=np.meshgrid(np.linspace(-1,1,W,dtype=np.float32),np.linspace(0,1,H,dtype=np.float32))
    clouds=(noise(X*1700,Y*1300,520,seed)+.4*noise(X*1700,Y*1300,160,seed+2)-.7)
    sky=np.array([229.,235.,233.])[None,None,:]+(clouds*7-Y*4)[...,None]
    image=np.clip(sky,0,255).astype(np.uint8)
    zbuffer=np.full((H,W),1e9,dtype=np.float32)
    ceiling=np.full(W,H,dtype=np.int32)
    xp=(np.arange(W)-W/2)/focal
    light=np.array([-.55,.77,-.32]); light/=np.linalg.norm(light)
    # Front-to-back voxel-space ray casting; write only newly exposed pixels.
    depths=np.geomspace(30,13500,steps)
    for zi,z in enumerate(depths):
        x=xp*z
        ht=height(x,z)
        py=np.floor(horizon-(ht-eye)/z*focal).astype(np.int32)
        py=np.clip(py,0,H)
        counts=np.maximum(ceiling-py,0)
        visible=counts>0
        if not np.any(visible): continue
        dx=(height(x+1.7,z)-height(x-1.7,z))/3.4
        dz=(height(x,z+1.7)-height(x,z-1.7))/3.4
        nn=np.sqrt(dx*dx+1+dz*dz)
        illumination=np.clip((-dx*light[0]+light[1]-dz*light[2])/nn,0,1)
        slope=np.sqrt(dx*dx+dz*dz)
        stone=np.clip((slope-.65)*1.15 + (noise(x,z,17,19)-.55)*1.45,0,1)
        stone*=np.clip((noise(x,z,110,4)-.27)*3,0,1)
        scree=np.clip((noise(x,z,86,24)-.58)*8,0,1)*np.clip((800-z)/570,0,1)
        scree*=np.clip((noise(x,z,18,27)-.35)*3,0,1)
        stone=np.maximum(stone,scree*.92)
        # Pitted blue shale emerges along steep wind-scoured faces.
        grain=(noise(x,z,1.8,13)-.5)*11
        snow=np.stack([170+illumination*66+grain,184+illumination*56+grain,188+illumination*49+grain],axis=-1)
        rock=np.stack([49+illumination*56+grain,66+illumination*54+grain,72+illumination*52+grain],axis=-1)
        color=snow*(1-stone[:,None])+rock*stone[:,None]
        fog=1-np.exp(-z/3900)
        mist=np.exp(-((ht-130)/180)**2)*np.clip((z-1000)/3800,0,.22)
        fog=np.clip(fog+mist,0,.96)
        atmosphere=np.array([200.,213.,215.])
        color=color*(1-fog[:,None])+atmosphere*fog[:,None]
        cols=np.repeat(np.where(visible)[0],counts[visible])
        base=np.repeat(py[visible],counts[visible])
        offsets=np.arange(len(cols))-np.repeat(np.cumsum(counts[visible])-counts[visible],counts[visible])
        rows=base+offsets
        image[rows,cols]=np.clip(color[cols],0,255).astype(np.uint8)
        zbuffer[rows,cols]=z
        ceiling[visible]=py[visible]
    im=Image.fromarray(image)
    # Three-dimensional brutalist relay: surfaces carry concrete formwork,
    # mineral streaks, freeze-thaw damage, dark apertures and accumulated snow.
    structure=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(structure)
    S=W/2400
    origin=np.array([290.,float(height(np.array([290.]),820)[0])+1,820.])
    def wp(v): return origin+np.array(v)
    def pp(v): return project(wp(v))
    def poly(v,color): d.polygon([pp(p) for p in v],fill=color)
    def line(v,color,width=1): d.line([pp(p) for p in v],fill=color,width=max(1,round(width*S)))
    def face(v,color,seed2=0):
        pts=np.array([pp(p) for p in v])
        minx=max(0,int(pts[:,0].min())); maxx=min(W,int(pts[:,0].max())+2)
        miny=max(0,int(pts[:,1].min())); maxy=min(H,int(pts[:,1].max())+2)
        if minx>=maxx or miny>=maxy: return
        mask=Image.new('L',(maxx-minx,maxy-miny)); md=ImageDraw.Draw(mask)
        md.polygon([(p[0]-minx,p[1]-miny) for p in pts],fill=255)
        yy,xx=np.mgrid[miny:maxy,minx:maxx]
        texture=(noise(xx,yy,19*S,seed2)-.5)*8+(noise(xx,yy,2.2*S,seed2+7)-.5)*13
        streak=np.maximum(noise(xx,yy*.06,6*S,seed2+3)-.55,0)*27
        arr=np.clip(np.array(color[:3])+texture[...,None]-streak[...,None],0,255).astype(np.uint8)
        patch=Image.fromarray(arr).convert('RGBA');patch.putalpha(mask)
        structure.alpha_composite(patch,(minx,miny))
    def block(x1,y1,z1,x2,y2,z2,base=105):
        face([(x1,y1,z1),(x2,y1,z1),(x2,y2,z1),(x1,y2,z1)],(base,base+12,base+13),11)
        face([(x2,y1,z1),(x2,y1,z2),(x2,y2,z2),(x2,y2,z1)],(base-26,base-10,base-5),21)
        face([(x1,y2,z1),(x2,y2,z1),(x2,y2,z2),(x1,y2,z2)],(210,222,220),25)
    # Back building and communications mast.
    block(7,-6,24,87,35,75,115)
    block(32,35,35,52,72,57,99)
    line([(42,72,45),(42,192,45)],(65,83,88,255),2.6)
    line([(42,189,45),(11,35,40)],(92,109,113,255),.75)
    line([(42,189,45),(89,35,68)],(91,108,113,255),.75)
    for by in [101,130,158,182]:
        line([(35,by,45),(49,by,45)],(74,94,101,255),1.4)
    line([(42,137,45),(65,150,45)],(82,98,103,255),1)
    line([(65,150,45),(65,119,45)],(82,98,103,255),1.4)
    # Heavy angled slab and recessed dark control room.
    block(-52,-13,-18,30,45,47,111)
    block(-47,44,-14,25,59,42,101)
    face([(-59,57,-24),(36,57,-24),(36,69,58),(-59,69,58)],(125,141,142),5)
    face([(-59,57,-24),(36,57,-24),(36,64,-24),(-59,64,-24)],(88,105,109),6)
    face([(-59,64,-24),(36,64,-24),(36,76,58),(-59,76,58)],(219,230,227),7)
    # Window slots, mullions, concrete joints, utilitarian door.
    face([(-44,28,-18.3),(21,28,-18.3),(21,38,-18.3),(-44,38,-18.3)],(31,51,58),13)
    for a in range(-41,22,10):
        line([(a,28,-18.5),(a,38,-18.5)],(112,128,128,255),1.5)
    for y in [4,18,43]:
        line([(-52,y,-18.6),(30,y,-18.6)],(90,108,112,150),.8)
    for x in [-31,-9,13]:
        line([(x,-2,-18.5),(x,43,-18.5)],(90,107,110,110),.65)
    face([(-23,-9,-18.8),(-9,-9,-18.8),(-9,16,-18.8),(-23,16,-18.8)],(39,60,66),4)
    line([(-24,17,-19),(-8,17,-19)],(191,207,206,255),1.5)
    # Low broken retaining wall.
    face([(-84,-11,-37),(-40,-11,-37),(-40,8,-37),(-54,11,-37),(-59,5,-37),(-67,9,-37),(-84,7,-37)],(123,139,141),14)
    line([(-84,7,-37),(-67,9,-37),(-59,5,-37),(-54,11,-37),(-40,8,-37)],(226,234,230,255),2.2)
    # A skeletal parabolic radar dish, pitched toward the abandoned valley.
    # Real 3-D circular ribs, not a satellite icon.
    hub=np.array([-16.,104.,17.])
    line([(-15,69,16),(-16,103,17)],(80,101,108,255),5)
    u=np.array([.9,.16,.30]);u/=np.linalg.norm(u)
    v=np.array([-.12,.96,-.2]);v/=np.linalg.norm(v)
    normal=np.cross(u,v);normal/=np.linalg.norm(normal)
    radius=28
    dish=[]
    for th in np.linspace(0,2*np.pi,150):
        q=hub+radius*(u*np.cos(th)+v*np.sin(th))+normal*9
        dish.append(q)
    poly(dish,(102,122,129,255))
    for r in [8,16,24,28]:
        ring=[hub+r*(u*np.cos(t)+v*np.sin(t))+normal*(r/radius)**2*9 for t in np.linspace(0,2*np.pi,110)]
        line(ring,(161,181,184,255),.75)
    for t in np.linspace(0,2*np.pi,20,endpoint=False):
        rib=[hub+r*(u*np.cos(t)+v*np.sin(t))+normal*(r/radius)**2*9 for r in np.linspace(0,radius,24)]
        line(rib,(53,80,91,255),1)
    feed=hub+normal*34
    for theta in [0,2.1,4.2]:
        edge=hub+radius*(u*np.cos(theta)+v*np.sin(theta))+normal*9
        line([edge,feed],(60,82,89,255),1)
    line([hub,feed],(61,82,89,255),2)
    # Surface-depth testing permits the foreground snow to partially bury walls.
    a=np.asarray(structure).copy()
    a[:,:,3][zbuffer<760]=0
    im=Image.alpha_composite(im.convert('RGBA'),Image.fromarray(a)).convert('RGB')
    # Sparse foreground debris, in perspective, with snow-capped rock facets.
    d=ImageDraw.Draw(im)
    for _ in range(180):
        z=float(rng.uniform(90,1500)); x=float(rng.uniform(-.8*z,.8*z))
        y=float(height(np.array([x]),z)[0]); sx,sy=project((x,y,z))
        if not(2<sx<W-2 and H*.59<sy<H-2):continue
        if zbuffer[int(sy),int(sx)]<z*.9:continue
        size=float(rng.uniform(.18,2.2))*focal/z
        if size<.7: continue
        col=tuple(np.array([58,76,82])+(np.array([200,213,215])-np.array([58,76,82]))*(1-np.exp(-z/3900)))
        col=tuple(map(int,col))
        aspect=float(rng.uniform(.25,.65))
        pts=[]
        for t in np.linspace(0,2*np.pi,11,endpoint=False):
            radius=float(rng.uniform(.65,1.15))
            pts.append((sx+math.cos(t)*size*radius,sy+math.sin(t)*size*aspect*radius))
        d.polygon(pts,fill=col)
        d.line(pts[6:10],fill=(194,207,207),width=max(1,round(size*.11)))
    # A single survivor: quiet human scale, not a figurative focal illustration.
    z=173.; x=-8.; y=float(height(np.array([x]),z)[0]);sx,sy=project((x,y,z))
    scale=focal/z
    def human_poly(coords,color): d.polygon([(sx+a*scale,sy-b*scale) for a,b in coords],fill=color)
    human_poly([(-.35,0),(-.21,1),(-.14,1.65),(.1,1.71),(.25,.98),(.32,.08),(.11,.04),(-.04,.75),(-.13,.03)],(42,62,68))
    human_poly([(-.25,.77),(-.38,1.33),(-.16,1.51),(.15,1.48),(.32,.83)],(54,74,78))
    d.ellipse((sx-.15*scale,sy-1.79*scale,sx+.17*scale,sy-1.43*scale),fill=(44,62,65))
    human_poly([(-.38,1.36),(-.47,.99),(-.26,.83),(-.20,1.31)],(39,59,66))
    d.line([(sx+.23*scale,sy-1.12*scale),(sx+.51*scale,sy-.05*scale)],fill=(63,79,82),width=max(1,round(S)))
    # Footprints disappear naturally into a short, winding approach.
    for i in range(13):
        pz=z-i*2.2-1;px=x+math.sin(i*.25)*.65+(-.2 if i%2 else .2)
        py=float(height(np.array([px]),pz)[0]); xx,yy=project((px,py,pz));rr=max(.7,focal/pz*.065)
        d.ellipse((xx-rr,yy-rr*.24,xx+rr,yy+rr*.3),fill=(143,164,170))
    # Photochemical grain unifies procedural surfaces without muddying the sky.
    arr=np.asarray(im).astype(np.float32)
    fine=rng.normal(0,.65,(H,W,1))
    arr+=fine
    return Image.fromarray(np.uint8(np.clip(arr,0,255)))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--width',type=int,default=2400)
    parser.add_argument('--height',type=int,default=1500)
    parser.add_argument('--seed',type=int,default=73)
    parser.add_argument('--steps',type=int,default=3300)
    parser.add_argument('--preview',action='store_true',help='Also save a 1200px PNG inspection preview')
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'assets'/'alpha-zone-landscape.webp')
    args=parser.parse_args()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    im=render(args.width,args.height,args.seed,args.steps)
    try:
        im.save(args.output,quality=92,method=6)
    except (KeyError,OSError):
        args.output=args.output.with_suffix('.png');im.save(args.output)
    detail=im.crop((0,int(args.height*.48),args.width,int(args.height*.92)))
    try:
        detail.save(args.output.parent/'landscape-detail.webp',quality=92,method=6)
    except (KeyError,OSError):
        detail.save(args.output.parent/'landscape-detail.png')
    if args.preview:
        preview=args.output.parent/'landscape-preview.png'
        im.resize((1200,round(1200*args.height/args.width)),Image.Resampling.LANCZOS).save(preview)
    print(f'Rendered {args.output} ({args.width} x {args.height}; {args.output.stat().st_size:,} bytes)')

if __name__=='__main__': main()
