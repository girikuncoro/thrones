from bs4 import BeautifulSoup
import urllib
from pprint import pprint
import csv
from collections import OrderedDict

key_words = ["Season(s)", "First seen", "Last seen", "Appeared in", "Mentioned in", "Titles", "Also known as", "Status", "Age", "Date of birth", "Death", "Origin", "Allegiance", "Culture", "Religion", "Family", "Portrayed by"]

char_list = open('char_list.txt', 'r')
info = OrderedDict()
count_char = 1

with open('throne_raw.csv', 'w') as csvfile:
    # Write CSV Header
    fieldnames = list(key_words)
    fieldnames.insert(0, 'Name')
    
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames) 
    writer.writeheader()

    # Scraping the web pages
    for url in char_list:  
        page = urllib.urlopen(url)
        soup = BeautifulSoup(page.read())

        # Find character information
        info['Name'] = url.split('/')[-1].replace('_',' ')

        for word in key_words:
            keys = soup.find(text=word)
            parent = keys.find_parent("div")
            value = parent.find_next_sibling("div").get_text()
            if '{{{' in value:
                info[word] = ''
            else:
                info[word] = value
                
        writer.writerow(info)
        print "Crawled {0} characters".format(count_char)
        count_char += 1
        
char_list.close()
print "Processing completed"