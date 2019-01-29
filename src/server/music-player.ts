import program = require('commander');
import { rescanLibrary } from "./find_tracks";
import { migrateDB } from "./migrations";
import { getConfig } from './config';

rescanLibrary().then(()=>{
    console.log("DONE!");
});

 
program
  .version('0.1.0')
  .option('-p, --peppers', 'Add peppers')
  .option('-P, --pineapple', 'Add pineapple')
  .option('-b, --bbq-sauce', 'Add bbq sauce')
  .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
 
//console.log('you ordered a pizza with:');
//if (program.peppers) console.log('  - peppers');
//if (program.pineapple) console.log('  - pineapple');
//if (program.bbqSauce) console.log('  - bbq');
//console.log('  - %s cheese', program.cheese);

program
  .command('library')
  .description('show watched directory')
  .action(function(cmd, options){
    const dirs = getConfig().media_library;
    for (const dir of dirs)  {
        console.log(dir);
    }
  })

program
  .command('rescan')
  .description('rescan music library')
  .action(function(cmd, options){
    rescanLibrary();
  })

program
  .command('migrate')
  .description('migrate database if needed')
  .action(function(cmd, options){
    migrateDB();
  })

program.parse(process.argv);

