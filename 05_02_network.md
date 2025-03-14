# Настройка маршрутизации в Linux

## Info
Если у вас будут такие ошибки при подключении по SSH:
```shell
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ED25519 key sent by the remote host is
SHA256:DRtS6I2c5wX98pcwHFET0LqMgrhwsjjP6DtROGjDXcq.
Please contact your system administrator.
Add correct host key in /home/user/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /home/user/.ssh/known_hosts:13
Host key for [localhost]:2222 has changed and you have requested strict checking.
Host key verification failed.
```

То игнорировать проверку и подключаться можно так:
```shell
ssh -o "StrictHostKeyChecking no" -p 2222 user@localhost
```
Подробнее прочитайте тут: https://habr.com/ru/companies/lodoss/articles/358800/

## Задание
У вас уже есть одна виртуальная машина. Давайте сделаем из неё маршрутизатор.
Схема подключения будет выглядеть так:

```asciiart
 |---LocalNet---|---NAT--------|-----YourISP------| 
VM2            VM1        HostMachine          Internet
```

Для этого нам понадобиться две виртуальные машины, на одной из которых будет два сетевых адаптера.
Внимание: сделайте резервную копию виртуальной машины, на случай если вы сломаете настройки.

VM1 - первая виртуальная машина. Её нужно выключить. После этого склонировать:
VirtualBox: Machine -> Clone
Затем в настройках VM1 добавить второй адаптер. Machine -> Settings -> Network -> Adapter2:
  Enable Network Adapter: true
  Attached to: Internal Network
В настройках виртуальной машины VM2 у нас уже есть один сетевой адаптер, его нужно подключить к Internal Network
Machine -> Settings -> Network -> Adapter1:
  Enable Network Adapter: true
  Attached to: Internal Network

Внимание: имя внутренней сети в настройках обеих виртуальных машин должно быть одинаковым (intnet по умолчанию)
Если у вас не хватает памяти для запуска двух виртуальных машин - уменьшите выделенный объём памяти для каждой из виртуальных машин. Достаточно выделить по 1GB RAM для каждой.

Включайте VM2
после логина настройте сеть
```shell
sudo nmcli connection modify enp0s3 IPv4.address 192.168.1.11/24
sudo nmcli connection modify enp0s3 IPv4.gateway 192.168.1.1
sudo nmcli connection modify enp0s3 IPv4.dns 8.8.8.8
sudo nmcli connection modify enp0s3 IPv4.method manual
sudo nmcli connection down enp0s3 && sudo nmcli connection up enp0s3
```
настройте имя хоста
```shell
hostnamectl set-hostname vm2
```
После релогина можно будет увидеть новую строку приветствия

Если теперь попробовать проверить сеть, то работать ничего не будет
```shell
ping -c 5 ya.ru
ping -c 5 8.8.8.8
ping -c 5 192.168.1.1
```

Включайте VM1
после логина настройте второй адаптер
```shell
sudo nmcli connection modify 'Wired connection 1' connection.id enp0s8
sudo nmcli connection modify enp0s8 IPv4.address 192.168.1.1/24
sudo nmcli connection modify enp0s8 IPv4.method manual
sudo nmcli connection down enp0s8 && sudo nmcli connection up enp0s8
```

Проверяем настройки:
```shell
sudo nmcli connection
```

Ожидаемый ответ:
```
NAME    UUID                                  TYPE      DEVICE 
enp0s3  978782f8-75e6-31b1-84be-a991067309e3  ethernet  enp0s3 
enp0s8  79f67b1b-1a64-3dd4-9bff-ba7ada21980d  ethernet  enp0s8 
lo      c94c7d2c-66b6-46a2-a9e6-e416324b1de6  loopback  lo

$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute 
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:b7:65:90 brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic noprefixroute enp0s3
       valid_lft 86094sec preferred_lft 86094sec
    inet6 fd00::a00:27ff:feb7:6590/64 scope global dynamic noprefixroute 
       valid_lft 86095sec preferred_lft 14095sec
    inet6 fe80::a00:27ff:feb7:6590/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:76:4f:42 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.1/24 brd 192.168.1.255 scope global noprefixroute enp0s8
       valid_lft forever preferred_lft forever
    inet6 fe80::f7ed:b5ba:f3ec:739b/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```
Проверяем соединение с VM2:
```shell
ping -c 5 192.168.1.11
```

На VM2 проверяем, что сеть работает локально, но доступа в интернет нет:
```shell
ping -c 5 ya.ru
ping -c 5 8.8.8.8
ping -c 5 192.168.1.1
```
Отвечает только 192.168.1.1 (VM1).

Внимание: далее настраиваем всё на VM1
Разрешим IP Forwarding (https://www.baeldung.com/linux/kernel-ip-forwarding) на VM1
```shell
sudo sysctl -w net.ipv4.ip_forward=1
```
в конец файла /etc/sysctl.conf нужно добавить строчку (команда на редактирование sudo vi /etc/sysctl.conf):
```txt
net.ipv4.ip_forward = 1
```
Это необходимо, чтобы разрешить ядру Linux перебрасывать IP пакеты (что роутер и делает).

Сетевые утилиты Linux, такие как nftables, iptables и Firewalld, могут служить как брандмауэром, так и маршрутизатором.

На Fedora по умолчанию установлен и запущен Firewalld
```shell
sudo systemctl status firewalld
```
Поэтому будем далее использовать его, для настройки NAT на VM1.

* Шпаркагла по firewalld: https://www.dmosk.ru/miniinstruktions.php?mini=firewalld-centos
* Документация: https://fedoraproject.org/wiki/Firewalld?rd=FirewallD
* Документация: https://docs.fedoraproject.org/en-US/quick-docs/firewalld/
* Пошаговая инструкция с комментариями (правда для centos): https://itproffi.ru/firewalld-ustanovka-i-nastrojka-zony-nat-probros-portov/

Назначаем зоны для интерфейсов:
```bash
sudo firewall-cmd --permanent --zone=external --change-interface=enp0s3
sudo firewall-cmd --permanent --zone=internal --change-interface=enp0s8
```

Включаем маскарадинг (NAT) для зоны external:
```bash
sudo firewall-cmd --permanent --zone=external --add-masquerade
```

Разрешаем весь исходящий трафик для зоны internal:
```bash
sudo firewall-cmd --permanent --zone=internal --set-target=ACCEPT
```

Разрешаем пересылку трафика между зонами:
```bash
sudo firewall-cmd --permanent --direct --add-rule ipv4 filter FORWARD 0 -i enp0s8 -o enp0s3 -j ACCEPT
sudo firewall-cmd --permanent --direct --add-rule ipv4 filter FORWARD 0 -i enp0s3 -o enp0s8 -m state --state RELATED,ESTABLISHED -j ACCEPT
```

Перезагружаем firewalld, чтобы применить изменения:
```bash
sudo firewall-cmd --reload
```

Проверяем настройки:
```bash
sudo firewall-cmd --list-all --zone=external
sudo firewall-cmd --list-all --zone=internal
```

Теперь на VM2 можно протестировать, что всё работает.
```shell
traceroute -m 60 www.bad.horse
curl -ks https://2ip.io
```
