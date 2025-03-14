# Шпаркалка команд для диагностика проблем в Linux

## Просмотр ресурсов (выйти можно клавище `q`, интерактивная помощь клавиша `h`)
```shell
top
```
## покрасивее - можно использовать htop, но он обычно по умолчанию не установлен
```shell
sudo dnf install htop
htop
```

## открытые дескрипторы
```shell
lsof
```

## открытые порты
```shell
netstat -nltp
```

## включая UDP (легко запомнить аргументы в другом порядке ;-) ):
```shell
netstat -tulpan
```

## открытые порты без lsof или netstat
```shell
declare -a array=($(tail -n +2 /proc/net/tcp | cut -d":" -f"3"|cut -d" " -f"1")) && for port in ${array[@]}; do echo $((0x$port)); done | sort | uniq
```

## запущенные процессы
```shell
ps auxww
```

## отсортируем по используемой памяти:
```shell
ps -o pid,user,%mem,command ax | sort -b -k3 -r
```

## или так:
```shell
ps axo rss,comm,pid \
  | awk '{ proc_list[$2]++; proc_list[$2 "," 1] += $1; } \
  END { for (proc in proc_list) { printf("%d\t%s\n", \
  proc_list[proc "," 1],proc); }}' | sort -n | tail -n 10 | sort -rn \
  | awk '{$1/=1024;printf "%.0fMB\t",$1}{print $2}'
```

## свободная память:
```shell
free -m
```

## Find swapped processes:
```shell
for file in /proc/*/status ; do awk '/VmSwap|Name|^Pid:/{printf $2 " " $3}END{ print ""}' $file; done| sort -k 3 -n -r | head
```

## Для отображения IO статистики, воспользуемся пакетом `sysstat`
```shell
dnf install sysstat
```

## статистика по IO
```shell
iostat
```

## свободное место
```shell
df -h
```

## свободные inodes
```shell
df -i
```

## пример как можно в одну строку писать (лучше не надо конечно, но оно работает ;-))
## Statistics of open files descriptors and sockets - мониторим в онлайне утечку файловых или сетевых дескрипторов:
```shell
while true; do echo -e "### $(date)\n# Open Sockets:"; netstat -a -n|grep -E "^(tcp)"| cut -c 68-|sort|uniq -c|sort -n|awk '{sum=sum+$1; print $0}END{print "# Total open sockets: " sum}'; echo -en "# Total open descriptors: $(cat /proc/sys/fs/file-nr | awk '{print ($1 - $2)}') \n# Current user open descriptors: "; /usr/sbin/lsof -Pn -u $USER 2>/dev/null | grep -v "$USER  mem\|$USER  cwd" | wc -l; echo -e "# Current user running process: $(/bin/ps -U $USER | wc -l)"; echo -e "\n\n"; sleep 10; done | tee open_sockets_$(date +%Y-%m-%d).log
```

## Попробуем поэмулировать проблемы с сестью
Для эмуляции плохой сети можно использовать пакет с версии ядра линукса 2.6 доступно:
details: https://wiki.linuxfoundation.org/networking/netem
https://github.com/SRTLab/srt-cookbook/blob/master/docs/how-to-articles/using-netem-to-emulate-networks.md
обновляем 245MB!
```shell
sudo dnf install iproute-tc kernel-debug-modules-extra kernel-modules-extra
ping -c 5 ya.ru
sudo tc qdisc add dev enp0s3 root netem delay 200ms # добавить на интерфейс enp0s3 задержку в 200мс
ping -c 5 ya.ru
sudo tc qdisc del dev enp0s3 root netem delay 200ms # удалить
```

## Если у нас поднят сервер на порту 8080 и вы хотите собрать статистику за некоторое время кто (какой IP) чаще всего подключается к серверу, можно использовать tcpdump:
```shell
tcpdump "dst port 8080 and tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn"  > tcpdump-8080
cat tcpdump-8080 | awk '{print $3}' | sed 's/\.[0-9]\+//g' | sort| uniq -c | sort -bgr | head
```

## Пример дампа TCP для wireshark с фильтрацией по IP и порту:
```shell
tcpdump "dst port 8080 and host 10.202.23.139" -s 65535 -w tcpdump-8080
```

## Проверить в виртуалке ли мы:
```shell
/sbin/lspci | grep 'Microsoft\|VMware'
```
или так:
```shell
grep -q ^flags.*\ hypervisor /proc/cpuinfo && echo "This machine is a VM" || echo "This is not a VM"
```

## Пример скрипта проверки доступности сетевых сервисов (./test.sh):
```shell
#!/usr/bin/env bash
RED='\e[1;31m'
GREEN='\e[1;32m'
YELLOW='\e[1;33m'
BLUE='\e[1;34m'
CLR='\e[0m'
IS_OK=true
SERVERS='127.0.0.1:22 127.0.0.1:8080'
for srv in ${SERVERS}; do
  >&2 echo -e "${YELLOW}Start checking ${BLUE}${srv}${CLR}"
  if ! echo | nc -v $(echo "$srv" | tr ':' ' ') 2>/dev/null; then
    IS_OK=false
    echo -e "${RED}${srv} is not available${CLR}"
  else
    echo -e "${GREEN}${srv} is good${CLR}"
  fi
done
[[ "${IS_OK}" == true ]] && echo "Total status: All is good" || echo "Total status: Something wrong"
```

## поднять тестовый сервер
```shell
python3 <<EOF
from http.server import BaseHTTPRequestHandler, HTTPServer
import time
hostName = "0.0.0.0"
hostPort = 8080
class MyServer(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"UP"}')

myServer = HTTPServer((hostName, hostPort), MyServer)
print(time.asctime(), "Server Starts - %s:%s" % (hostName, hostPort))

try:
    myServer.serve_forever()
except KeyboardInterrupt:
    pass

myServer.server_close()
print(time.asctime(), "Server Stops - %s:%s" % (hostName, hostPort))
EOF
```

В соседнем терминале его можно проверить
```shell
netstat -tulpan
curl localhost:8080/test
```

## и проверьте теперь скрипт мониторинга
```shell
./test.sh
```

## Эмулируем нагрузку на CPU (8 потоков в этом примере)
В соседнем терминале запустите `top` и наблюдайте за изменениями потребления ресурсов
```shell
fulload() { dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null & }; fulload; read; killall dd
```

## Эмуляция высокого потребления памяти
В соседнем терминале запустите `top` и наблюдайте за изменениями потребления ресурсов
```shell
head -c 1000m /dev/zero | tail
head -c 5000m /dev/zero | tail
```

# Проверить сертификат:
```shell
echo | \
    openssl s_client -connect ya.ru:443 -showcerts 2>/dev/null | \
    openssl x509 -text | \
    grep -B 2 "Subject:\|Issuer:"
```
