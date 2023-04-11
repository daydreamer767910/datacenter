/**
 *   vdb billing
 *
 *   @copyright 2023 Bill.Liu .
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

type DataSource = {
  name: string;
  regex?: string;
};

type HeaderInfo = {
  name: string
  datatype: string
  default?: any
  datasrc?: DataSource | null
};

interface RowData {
  Fields: Array<any>;
}

interface Table {
  GetName(): string;
  SetHeaderList(headers: HeaderInfo[]): void;
  GetHeader(x: string | number): HeaderInfo | null | undefined;
  InsertData(data: RowData): number;
  GetData(idx: number) : RowData | null
  GetDataSize(): number;
  DeleteData(idx: number, num: number): RowData[] | null;
}

export { Table, HeaderInfo, RowData };
