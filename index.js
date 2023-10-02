const axios = require('axios');
const express = require('express');
const fs = require('fs');
const app = express();


// 定义包含多个节点信息的订阅链接
const subscriptionURL = ''; // 请替换为实际的订阅链接

// 使用 Express 中的路由来监听参数
app.get('/sub/*', (req, res) => {
    const subUrl = req.params[0]; // 获取参数值
    


    // 使用axios发送GET请求获取订阅内容
    axios.get(subUrl)
    .then((response) => {
    const subscriptionText = Buffer.from(response.data,'base64').toString();

    // 在这里可以根据订阅内容的格式进行解析和转换
    // 假设订阅内容是一行一个节点信息的形式，每行包括Shadowsocks和V2Ray的节点信息，例如：
    // Shadowsocks节点：ss://YWVzLTI1Ni1nY206MTIzNDU2Nzg5@server-address:port#remark
    // V2Ray节点：vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogIue+juWbvV9EQzAyLWNsb25lIiwNCiAgImFkZCI6ICJ0ZXN0LnRlc3QuY29tIiwNCiAgInBvcnQiOiAiNDQzIiwNCiAgImlkIjogIjY3NWJiZWJjLTFiOTItNDgyNC04MGIyLTlhOTI1YmRjYmUxOCIsDQogICJhaWQiOiAiMCIsDQogICJzY3kiOiAiYXV0byIsDQogICJuZXQiOiAid3MiLA0KICAidHlwZSI6ICJub25lIiwNCiAgImhvc3QiOiAidGVzdC50ZXN0LmNvbSIsDQogICJwYXRoIjogIi82NzViYmViYy0xYjkyLTQ4MjQtODBiMi05YTkyNWJkY2JlMTgiLA0KICAidGxzIjogInRscyIsDQogICJzbmkiOiAiIiwNCiAgImFscG4iOiAiIg0KfQ==
    const lines = subscriptionText.split('\n');
    
    // 定义用于存储Shadowsocks节点配置和V2Ray节点配置的数组
    const ssProxyConfigs = [];
    const v2rayProxyConfigs = [];

    // 将每个节点信息分别转换为Shadowsocks和V2Ray的配置项
    lines.forEach((line) => {
        if (line.startsWith('ss://')) {
        const parts = line.match(/ss:\/\/([^@]+)@([^:]+):(\d+)#(.+)/);
        if (parts && parts.length === 5) {
            const passwordAndEncryptMethod = Buffer.from(parts[1], 'base64').toString();
            const password  = passwordAndEncryptMethod.split(':')[1]; // 提取密码部分
            const method = passwordAndEncryptMethod.split(':')[0]; // 提取encrypt-method部分
            const serverAddress = parts[2];
            const serverPort = parts[3];
            const remark = decodeURI(parts[4]);
        //   const proxyConfig = `${remark} = ss, ${serverAddress}, ${serverPort}, encrypt-method=${method}, password=${password}, obfs=tls, obfs-host=${serverAddress}, tls-verification=0, tag=${remark}`;
            const proxyConfig = `${remark} = ss, ${serverAddress}, ${serverPort}, encrypt-method=${method}, password=${password}, udp-relay=true, tag=${remark}`;
            ssProxyConfigs.push(proxyConfig);
        }
        } else if (line.startsWith('vmess://')) {
        // 处理V2Ray节点信息，您可以根据V2Ray配置格式进行解析
        // 这里假设V2Ray节点信息格式为vmess://...
        // 您需要根据实际情况编写V2Ray配置项的转换逻辑
        // 例如：const v2rayConfig = ...;
        // v2rayProxyConfigs.push(v2rayConfig);
        // 处理V2Ray节点信息
        // 处理V2Ray节点信息
        const v2rayConfig = Buffer.from(line.substring(8), 'base64').toString('utf-8');
        // console.log(v2rayConfig);
        try {
            const v2rayInfo = JSON.parse(v2rayConfig);
            const serverAddress = v2rayInfo.add;
            const serverPort = v2rayInfo.port;
            const uuid = v2rayInfo.id;
            const alterId = v2rayInfo.aid || 0; // 如果没有指定alterId，默认为0
            const security = v2rayInfo.security || 'auto'; // 如果没有指定加密方式，默认为'auto'
            const remark = v2rayInfo.ps;
            const sni = v2rayInfo.host;
            const ws = v2rayInfo.net;
            const path = v2rayInfo.path;

            // 构建V2Ray节点配置
            const v2rayProxyConfig = `${remark} = vmess, ${serverAddress}, ${serverPort}, username=${uuid},skip-cert-verify=true,sni=${sni},ws=${ws === 'ws' ? 'true' : 'false'},ws-path=${path},ws-headers=Host:"${sni}",vmess-aead=${alterId === '0' ? 'true' : 'false'}, tls=${security === 'auto' ? 'true' : 'false'}, tag=${remark}`;
            v2rayProxyConfigs.push(v2rayProxyConfig);
        } catch (e) {
            console.error('解析V2Ray配置信息时出错：', e);
        }
        }
    });

    // 构建Surge配置文件格式
    const surgeConfig = `${ssProxyConfigs.join('\n')}\n${v2rayProxyConfigs.join('\n')}`;
    // 在这里可以根据参数值执行相应的操作
    // res.send(`订阅地址 是：${subUrl} ('\n') ${surgeConfig}`);
    res.send(`${surgeConfig}`);

    // 将Surge配置文件保存到本地
    fs.writeFileSync('surge-config.conf', surgeConfig);

    console.log('已将订阅内容转换为Surge配置文件。');
    })
    .catch((error) => {
    console.error('获取订阅内容时出错：', error);
    });


  });

const port = 18848; // 指定 Express 应用程序的端口
app.listen(port, () => {
  console.log(`Express 服务器正在监听端口 ${port}`);
});



