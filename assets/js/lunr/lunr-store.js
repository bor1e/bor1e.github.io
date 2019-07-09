var store = [{
        "title": "Ansible just rocks - a small reusable overview",
        "excerpt":"As a fullstack developer, one often faces the situation of deploying an application to a server. This is basically a routine job, once you finish the local development and test, you want to see your application live on a server. This in turn means, you have to create a LAMP or a MEAN or similar ready-to-go server, i.e. a server which has all the used services and libs installed. If this is something you face often you should take a look on ansible, which allows a pretty fast and save way to create a ready to deploy server.   Use Case  Since, I often use databases and webframeworks, I decided to automate the process of deployment, to be able to primarly focus on creating webapplications and focusing less on server initialization.  Goal::     pass the host-IP and CNAME   perform some ansible-magic   visit the CNAME server, find the application running without presonally ssh-ing the server!   Solution  Ansible performs automation and orchestration of IT environments by accessing the server via SSH and running YAML playbooks, which in turn install/setup/configure the server instead of you. So what services and libs should be preinstalled on the server for my appliaction to run?   In my case, building a Django the following is a list of required libs/services, referred to as roles, I prepared to be installed/performed on any given server:     python3,   nginx and guincorn,   postgresql,   user   As you probably noticed, I categorized them already, first is framework related-language libs, followed by a webserver, than a DB and finally a user, who will be responsible for deployment.   Tree view of ansible setup folder:  As recommended by Ansible’s Best Practises.   Ansible-Magic:     create a server and copy the ip address   add the ip-adress to the group-vars and hosts   run ansible-playbook -i hosts init_and_deploy.yml   visit ip adress, app is running!   Your application is LIVE on Production mode!   Lessons-Learned     Use seperate user-roles for initializing (root) a server and a deployment (not root) on an initialized webserver.   Virtualenv Permission Denied [Errno 13]            make sure virtualenv is being run by deployment user           log into server &amp; run command   use ansible-playbook -i hosts init-and-deploy.yml --start-at-task=&lt;LAST_FAILED_TASK&gt;   check warnings and not ignore them   run ansible with vvv for extended messages from ansible   once configuren n-times used      What are you doing?         Trying to fix the problems I created, when I was trying to fix the problems I created, when I was trying to…      ","categories": ["DevOps"],
        "tags": [],
        "url": "http://localhost:4000/devops/ansible-and-build-automation/",
        "teaser":"http://localhost:4000/assets/images/teaser.png"},{
        "title": "Zollhof Hackathon - Data Discovery for N-ergie/VAG",
        "excerpt":"As a fullstack developer, one often faces the situation of deploying an application to a server. This is basically a routine job, once you finish the local development and test, you want to see your application live on a server. This in turn means, you have to create a LAMP or a MEAN or similar ready-to-go server, i.e. a server which has all the used services and libs installed. If this is something you face often you should take a look on ansible, which allows a pretty fast and save way to create a ready to deploy server.   Use Case  Since, I often use databases and webframeworks, I decided to automate the process of deployment, to be able to primarly focus on creating webapplications and focusing less on server initialization.  Goal::     pass the host-IP and CNAME   perform some ansible-magic   visit the CNAME server, find the application running without presonally ssh-ing the server!   Solution  Ansible performs automation and orchestration of IT environments by accessing the server via SSH and running YAML playbooks, which in turn install/setup/configure the server instead of you. So what services and libs should be preinstalled on the server for my appliaction to run?   In my case, building a Django the following is a list of required libs/services, referred to as roles, I prepared to be installed/performed on any given server:     python3,   nginx and guincorn,   postgresql,   user   As you probably noticed, I categorized them already, first is framework related-language libs, followed by a webserver, than a DB and finally a user, who will be responsible for deployment.   Tree view of ansible setup folder:  As recommended by Ansible’s Best Practises.   Ansible-Magic:     create a server and copy the ip address   add the ip-adress to the group-vars and hosts   run ansible-playbook -i hosts init_and_deploy.yml   visit ip adress, app is running!   Your application is LIVE on Production mode!   Lessons-Learned     Use seperate user-roles for initializing (root) a server and a deployment (not root) on an initialized webserver.   Virtualenv Permission Denied [Errno 13]            make sure virtualenv is being run by deployment user           log into server &amp; run command   use ansible-playbook -i hosts init-and-deploy.yml --start-at-task=&lt;LAST_FAILED_TASK&gt;   check warnings and not ignore them   run ansible with vvv for extended messages from ansible   once configuren n-times used      What are you doing?         Trying to fix the problems I created, when I was trying to fix the problems I created, when I was trying to…      ","categories": ["DevOps"],
        "tags": [],
        "url": "http://localhost:4000/devops/data-discovery-hackaton-zollhof/",
        "teaser":"http://localhost:4000/assets/images/teaser.png"},{
        "title": "To Learn & Checkout",
        "excerpt":"Goal::     https://pingouin-stats.org/index.html   Lessons-Learned           What are you doing?         Trying to fix the problems I created, when I was trying to fix the problems I created, when I was trying to…      ","categories": ["Interesting"],
        "tags": [],
        "url": "http://localhost:4000/interesting/to-learn/",
        "teaser":"http://localhost:4000/assets/images/teaser.png"}]
