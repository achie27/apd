a = []
with open("anime.txt", "r") as f:
	a = list(f)

a = [x.split() for x in a]

for x in a:
	r = requests.get(x[1], stream = True)
	with open(x[0], 'wb') as f:
		for chunk in r.iter_content(chunk_size=50*1024):
			if chunk :
				f.write(chunk)