import struct,zlib
from pathlib import Path

def inside(x,y,poly):
    result=False
    j=len(poly)-1
    for i in range(len(poly)):
        a,b=poly[i],poly[j]
        if ((a[1]>y)!=(b[1]>y)) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
        j=i
    return result

def image(n,path):
    shapes=[[(.27,.23),(.39,.23),(.39,.77),(.27,.77)],[(.43,.5),(.62,.23),(.76,.23),(.56,.5),(.77,.77),(.63,.77)]]
    raw=bytearray()
    for y in range(n):
        raw.append(0)
        for x in range(n):raw.extend((21,32,23) if any(inside(x/n,y/n,p) for p in shapes) else (198,237,133))
    def chunk(tag,data):return struct.pack('!I',len(data))+tag+data+struct.pack('!I',zlib.crc32(tag+data)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',n,n,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
    Path(path).write_bytes(png)
for n,name in [(192,'icon-192.png'),(512,'icon-512.png'),(180,'apple-touch-icon.png')]:image(n,'public/icons/'+name)
