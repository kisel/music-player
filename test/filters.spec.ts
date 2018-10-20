import { expect } from 'chai';
import { buildFuzzySearch } from '../src/utils/filters';

it('should do fuzzy search', ()=>{
    expect(buildFuzzySearch("scotch disco").test("SCOTCH - DISCO BAND")).to.be.true;
    expect(buildFuzzySearch("^scotch").test("SCOTCH - DISCO BAND")).to.be.true;
    expect(buildFuzzySearch("band ").test("SCOTCH - DISCO BAND")).to.be.true;
    expect(buildFuzzySearch("band $").test("SCOTCH - DISCO BAND")).to.be.true;
})

it('should not throw exceptions', ()=>{
    expect(buildFuzzySearch("sc[otch disco").test("SCOTCH - DISCO BAND")).to.be.false;
    expect(buildFuzzySearch("scotch disco").test("SCOTCH - DISCO BAND")).to.be.true;
})
