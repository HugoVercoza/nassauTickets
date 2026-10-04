CREATE DATABASE nassauTickets;
USE nassauTickets;

CREATE TABLE usuarios (
	id_usu int not null auto_increment primary key,
    nome varchar(100) not null,
    login varchar(30) unique not null,
    senha_hash varchar(255) not null,
    tipo enum('ATENDENTE', 'GESTOR') DEFAULT 'ATENDENTE'
);

CREATE TABLE guiches (
	id_gui int not null auto_increment primary key,
    numero_guiche int not null,
    estado_gui enum('ABERTO', 'FECHADO') DEFAULT 'FECHADO'
);

CREATE TABLE senhas (
	id_sen int not null auto_increment primary key,
    codigo varchar(12) not null unique,
    tipo enum('SP', 'SG', 'SE'),
    estado enum('EMITIDA', 'AGUARDANDO', 'CHAMADA', 'CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO', 'ATENDIDA', 'NÃO_COMPARECEU') DEFAULT 'EMITIDA',
    data_criacao datetime not null DEFAULT current_timestamp,
    data_primeira_chamada datetime default null,
    data_segunda_chamada datetime default null,
    data_inicio_atendimento datetime default null,
    data_finalizacao datetime default null,
    id_usu int,
    id_gui int
);


alter table senhas
add constraint fk_senhas_usuarios
foreign key (id_usu)
references usuarios(id_usu);

alter table senhas
add constraint fk_senhas_guiches
foreign key (id_gui) 
references guiches(id_gui);