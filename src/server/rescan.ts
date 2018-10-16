import { importDir, rescanLibrary } from "./find_tracks";

rescanLibrary().then(()=>{
    console.log("DONE!");
});
