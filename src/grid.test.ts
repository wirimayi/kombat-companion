import {describe,it,expect} from 'vitest';
import {collectionRects,levelValue,romanValue} from './grid';
import {matchGridName} from './grid-reader';
describe('collection grid review',()=>{
 it('does not treat attack or power digits as a fighter level',()=>{
  for(const s of ['85,867','750','0','61','1 2',''])expect(levelValue(s)).toBeNull();
  expect(levelValue('60')).toBe(60);expect(levelValue('1')).toBe(1);
 });
 it('rejects malformed Roman badges instead of guessing',()=>{
  expect(romanValue('IX')).toBe(9);expect(romanValue('VIII')).toBe(8);
  expect(romanValue('VX')).toBeNull();expect(romanValue('')).toBeNull();
 });
 it('finds full variant names despite artwork noise',()=>{
  expect(matchGridName('I FE\nDarkest Knight\nNOOB SAIBOT |,','character').name).toBe('Darkest Knight Noob Saibot');
  expect(matchGridName('Black Dragon\nERRON BLACK |','character').recognized).toBe(true);
 });
 it('does not turn an incomplete variant into a base fighter',()=>{
  expect(matchGridName('SCORPION','character').id).toBeNull();
  expect(matchGridName('MK\nSCORPION','character').id).toBeNull();
 });
 it('retains recognized unsupported names without inventing mechanics',()=>{
  const found=matchGridName('Peaceful Mind','gear');expect(found.name).toBe('Peaceful Mind');expect(found.recognized).toBe(true);
 });
 it('does not detect cards in a blank or portrait image',()=>{
  expect(collectionRects(new Uint8ClampedArray(2048*943*4),2048,943)).toEqual([]);
  expect(collectionRects(new Uint8ClampedArray(100*200*4),100,200)).toEqual([]);
 });
});
