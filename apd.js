const fs = require("fs");
const request = require("request");
const puppeteer = require("puppeteer");

let anime_link = "https://animepahe.com/anime/gekkan-shoujo-nozaki-kun-specials";
let mp4upload_links = [];
let episode_links = [];
let dl_links = [];
let total_eps = 0;

function get_links(ep_id, res, total_eps, anime_title, sub, ep_no, bd){
	return function(){
		let promise = new Promise((resolve, reject) => {
			request("https://animepahe.com/api?m=embed&id="+ep_id+"&p=mp4upload", (err, res, html) => {
				if(!err){
					resolve(JSON.parse(res["body"])["data"][""+ep_id]["720p"]["url"]);
				}
			})
		});
			
		promise.then((link) => {
			mp4upload_links.push(link);
			if(mp4upload_links.length == total_eps){
				console.log("got links");
				
				(async () => {
					process.setMaxListeners(0);
					const browser = await puppeteer.launch();
					const page = await browser.newPage();
					for(i in mp4upload_links){
						await page.goto(mp4upload_links[i]);
						let vid = await page.evaluate(() => {
							return document.getElementsByClassName('jw-video')[0].src
						});
						let no = Number(i)+1;
						let f_name = "AnimePahe_"+anime_title+"_-_"+no+"_720p_"+sub+".mp4";
						dl_links.push([f_name, vid]);

						if(dl_links.length == total_eps){
							download();
						}
					}

					browser.close();
			
				})();
			}
		});
	}
}

function download(ind){
	// if(ind >= total_eps){
	// 	return;
	// }

	// let pr = new Promise((resolve, reject) => {
	// 	let f_name = dl_links[ind][0];
	// 	let vid = dl_links[ind][1];

	// 	console.log(f_name+" has begun");

	// 	let file = fs.createWriteStream(f_name, { bufferSize: 64 * 1024 });
	// 	let stream=request(vid).pipe(file);

	// 	stream.on('end', ()=> {
	// 		file.close(()=>{
	// 			console.log("done "+f_name)
	// 		});
	// 		resolve(ind+1);
	// 	});
		
	// })
	
	// pr.then((r)=> {
	// 	download(r+1);
	// })

	let file = fs.createWriteStream("anime.txt");
	let str = "";
	for(dl of dl_links){
		str += dl[0] + " " + dl[1]+"\n";
	}

	file.write(str);
	file.close(()=>{
		console.log("saved");
	})
}


request(anime_link, (err, res, html) => {
	if(!err){
		let id_start = html.search("release&id=") + 11;
		let id = html.slice(id_start, html.slice(id_start).search("&")+id_start);
		
		request("https://animepahe.com/api?m=release&id="+id, (err, res, html) => {
			if(!err){
				episode_links = JSON.parse(res["body"])["data"];
				total_eps = episode_links.length;

				console.log("episode_links done");
				
				for (let i in episode_links){
					let ep_id = episode_links[i].id;
					let anime_title = episode_links[i].anime_title.split(" ").join("_");
					let ep_no = episode_links[i].episode;
					let sub = episode_links[i].fansub;
					let bd = episode_links[i].disc;
					let f = get_links(ep_id, res, total_eps, anime_title, sub, ep_no, bd);
					f();
				}
			}
		})
	}
})
