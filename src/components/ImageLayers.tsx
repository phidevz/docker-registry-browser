/*
 * Docker Registry Browser
 * Copyright (c) 2022 phidevz
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DownloadOutlined } from "@ant-design/icons";
import { Alert, Button, Table, Tooltip } from "antd";
import { ColumnsType } from "antd/lib/table";
import filesize from "filesize";
import { FsLayer, HistoryEntry } from "../ApiTypes"

interface TableRecord {
    order: number,
    cmd: string,
    fsLayer: FsLayer
}

function normalizeCommand(cmd: string): string {
    const shStr = "/bin/sh -c ";
    const nopStr = "#(nop) ";

    if (!cmd.startsWith(shStr)) {
        return cmd;
    }

    cmd = cmd.substring(shStr.length);

    if (cmd.startsWith(nopStr)) {
        return cmd.substring(nopStr.length);
    }

    return "RUN " + cmd;
}

export default function ImageLayers(props: { history: HistoryEntry[], fsLayers: FsLayer[] }) {
    const history = props.history.reverse();
    const fsLayers = props.fsLayers.reverse();

    if (history.length !== fsLayers.length) {
        return (
            <Alert message="Image History and Filesystem Layers' length do not match" type="error" />
        );
    }

    const entries = history.map((historyEntry, index) => {
        return {
            order: index + 1,
            cmd: normalizeCommand(historyEntry.v1Compatibility.container_config.Cmd.map(cmd => cmd.trim()).join(" ")),
            fsLayer: fsLayers[index]
        } as TableRecord
    });

    const columns: ColumnsType<TableRecord> = [
        {
            title: "Order",
            dataIndex: "order",
            align: 'center'
        },
        {
            title: "Blob",
            dataIndex: ["fsLayer", "blobSum"],
            render: (text, record, index) => {
                return (<Tooltip title={record.fsLayer.blobSum}>
                    <Button type="link" shape="default" href={record.fsLayer.blobPath} icon={<DownloadOutlined />} />
                </Tooltip>);
            },
            align: 'center'
        },
        {
            title: "Size",
            dataIndex: ["fsLayer", "blobSize"],
            render: (text, record, index) => {
                return (<>{filesize(record.fsLayer.blobSize)}</>);
            },
            width: "8em",
            align: 'left'
        },
        {
            title: "Command",
            dataIndex: "cmd",
            className: "manifest-command"
        }
    ];

    return (<Table dataSource={entries} columns={columns} />)
}