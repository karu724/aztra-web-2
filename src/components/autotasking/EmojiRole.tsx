import React, { useState } from 'react';
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  Modal,
  OverlayTrigger,
  Row,
  Spinner,
  Table,
  Tooltip,
} from 'react-bootstrap';
import {
  Add as AddIcon,
  RemoveCircleOutline,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import RoleBadge, { AddRole } from 'components/forms/RoleBadge';
import EmojiPickerI18n from 'defs/EmojiPickerI18n';
import { Emoji, Picker, getEmojiDataFromNative } from 'emoji-mart';

import styles from 'styles/components/autotasking/EmojiRole.module.scss';
import classNames from 'classnames/bind';
import { EmojiRoleData } from 'types/autotask/action_data';
import { ChannelMinimal, PartialGuild, Role } from 'types/DiscordTypes';
import { EmojiRoleParams } from 'types/autotask/params';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import ChannelSelectCard from 'components/forms/ChannelSelectCard';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import api from 'datas/api';
import prefixes from 'datas/prefixes';
import Cookies from 'universal-cookie';
import { TaskSet } from 'types/autotask';
import filterChannels from 'utils/filterChannels';
import emoji from 'node-emoji';
import emoji2 from 'node-emoji-new';
import emojiData from 'emoji-mart/data/all.json';
const cx = classNames.bind(styles);

interface EmojiRoleProps {
  guild: PartialGuild | null;
  channels: ChannelMinimal[];
  roles: Role[];
  saving?: boolean;
  saveError?: boolean;
  editMode?: boolean;
  closeButton?: boolean;
  defaultTask?: TaskSet<EmojiRoleParams, EmojiRoleData[]>;
  onSubmit?: (
    data: { params: EmojiRoleParams; data: EmojiRoleData[] },
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
  onClose?: Function;
}

const EmojiRole: React.FC<EmojiRoleProps> = ({
  guild,
  channels,
  roles,
  saving,
  saveError,
  editMode,
  closeButton,
  defaultTask,
  onSubmit,
  onClose,
}) => {
  const [newParams, setNewParams] = useState<Partial<EmojiRoleParams>>(
    defaultTask?.params ?? {}
  );
  const [newAddedData, setNewAddedData] = useState<EmojiRoleData[]>(
    defaultTask?.data ?? []
  );
  const [newData, setNewData] = useState<
    Omit<EmojiRoleData, 'emoji'> & { emoji?: string | null }
  >({ add: [], remove: [] });
  const [channelSearch, setChannelSearch] = useState('');
  const [inputMessageId, setInputMessageId] = useState(false);

  const [selectMessage, setSelectMessage] = useState(false);
  const [selectMessageToken, setSelectMessageToken] = useState<string | null>(
    null
  );
  const [selectMessageStatus, setSelectMessageStatus] = useState<
    'pending' | 'done' | 'timeout' | 'error' | null
  >(null);
  const [cancelSelectMessage, setCancelSelectMessage] =
    useState<CancelTokenSource | null>(null);

  const MessageSelectionReq = () => {
    const token = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0'); // Math.random().toString(36).slice(2, 7)
    setSelectMessageToken(token);

    const source = axios.CancelToken.source();
    setCancelSelectMessage(source);

    setSelectMessageStatus('pending');

    axios
      .get(
        `${api}/discord/guilds/${guild?.id}/channels/${newParams.channel}/select-message?token=${token}`,
        {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
          cancelToken: source.token,
        }
      )
      .then(({ data }) => {
        setSelectMessageToken(null);
        setSelectMessageStatus('done');
        setNewParams({ ...newParams, message: data.messageId });
      })
      .catch((_e) => {
        if (_e.isAxiosError) {
          const e: AxiosError = _e;
          if (e.response?.data.message === 'AWAIT_TIMEOUT') {
            setSelectMessageStatus('timeout');
          } else {
            setSelectMessageStatus('error');
          }
        }
      });
  };

  const CancelMessageSelectionReq = () => {
    setSelectMessage(false);
    if (cancelSelectMessage) cancelSelectMessage.cancel();
  };

  const emd = newData.emoji
    ? getEmojiDataFromNative(newData.emoji, 'twitter', emojiData as any)
    : null;

  const filteredChannels = filterChannels(channels, channelSearch);

  return (
    <>
      <Row className="mb-3">
        <Col>
          <h5 className="pt-2">????????? ??????:</h5>
          <Form.Text className="pb-3">
            ????????? ?????? ???????????? ?????? ????????? ???????????????
          </Form.Text>
          <Form.Group
            className="py-2"
            style={{ backgroundColor: '#424752', borderRadius: 10 }}
          >
            <Container fluid className="px-3">
              <Row className="align-items-center mb-2">
                {newParams.channel ? (
                  <>
                    <Card bg="secondary" className="w-100">
                      <Card.Header
                        className="py-1 px-0"
                        style={{
                          fontFamily: 'NanumSquare',
                          fontSize: '13pt',
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faHashtag}
                          className="me-2 my-auto"
                          size="sm"
                        />
                        {channels.find((o) => o.id === newParams.channel)?.name}
                      </Card.Header>
                    </Card>
                  </>
                ) : (
                  <Form.Label className="fw-bold px-2 my-auto">
                    ????????? ????????? ????????????!
                  </Form.Label>
                )}
              </Row>
              <Row className="pb-2">
                <input hidden={true} />
                <Form.Control
                  type="text"
                  placeholder="?????? ??????"
                  onChange={(e) => setChannelSearch(e.target.value)}
                />
                <Form.Text className="py-1 px-2">
                  {filteredChannels.length}??? ?????? ??????
                </Form.Text>
              </Row>
              <Row
                style={{
                  maxHeight: 180,
                  overflow: 'auto',
                  borderRadius: '10px',
                  display: 'block',
                }}
              >
                {channels ? (
                  filteredChannels.map((one) => (
                    <ChannelSelectCard
                      key={one.id}
                      selected={newParams.channel === one.id}
                      channelData={{
                        channelName: one.name,
                        parentChannelName: channels?.find(
                          (c) => c.id === one.parentId
                        )?.name,
                      }}
                      onClick={() =>
                        setNewParams({ ...newParams, channel: one.id })
                      }
                    />
                  ))
                ) : (
                  <h4>???????????? ???</h4>
                )}
              </Row>
            </Container>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col>
          <h5 className="pt-3">????????? ?????????:</h5>
          <Form.Text className="pb-3">
            {inputMessageId ? (
              <>
                ????????? ?????? ????????? ???????????? ???????????????. ??????{' '}
                <a
                  className="cursor-pointer text-decoration-none"
                  style={{ color: 'DeepSkyBlue' }}
                  onClick={() => setInputMessageId(false)}
                >
                  ????????? ????????? ????????????
                </a>
              </>
            ) : (
              <>
                ????????? ???????????? ???????????? ????????? ???????????? ????????? ??? ????????????.
                ??????{' '}
                <a
                  className="cursor-pointer text-decoration-none"
                  style={{ color: 'DeepSkyBlue' }}
                  onClick={() => setInputMessageId(true)}
                >
                  ?????? ????????? ????????????
                </a>
              </>
            )}
          </Form.Text>
        </Col>
      </Row>
      <Row className="pt-2">
        {(inputMessageId || newParams.message) && (
          <Col sm="auto" md={4} className="pe-sm-0">
            <Form.Control
              className="mb-2"
              as="input"
              type="text"
              placeholder="????????? ?????????"
              value={newParams.message ?? ''}
              readOnly={!inputMessageId}
              onChange={(e) => {
                if (isNaN(Number(e.target.value))) return;
                setNewParams({ ...newParams, message: e.target.value });
              }}
            />
          </Col>
        )}
        {!inputMessageId && (
          <>
            <Col>
              <Button
                variant={newParams.channel ? 'aztra' : 'danger'}
                size={!newParams.channel ? 'sm' : undefined}
                disabled={selectMessage || !newParams.channel}
                onClick={() => setSelectMessage(true)}
              >
                {newParams.channel
                  ? `????????? ${newParams.message ? '??????' : ''} ????????????`
                  : '????????? ?????? ????????? ??????????????????!'}
              </Button>
            </Col>
            <Modal
              className="modal-dark"
              show={selectMessage}
              centered
              size="lg"
              onShow={MessageSelectionReq}
              onHide={() => {}}
            >
              <Modal.Header>
                <Modal.Title
                  style={{
                    fontFamily: 'NanumSquare',
                    fontWeight: 900,
                  }}
                >
                  ????????? ????????????
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                {selectMessageStatus !== 'done' && (
                  <div>
                    <h5>1. ????????? ?????? ?????? ?????????</h5>
                    <p className="ps-2">
                      <span className="h5">{guild?.name}</span> ????????????{' '}
                      <span className="h5">
                        #
                        {channels.find((o) => o.id === newParams.channel)?.name}
                      </span>{' '}
                      ???????????? ????????? ???????????? ???????????? ???????????? ????????????{' '}
                      <b>??????</b>??? ???????????????.
                    </p>
                    <h5>2. ????????? ??????</h5>
                    <p className="ps-2">
                      <span
                        className="fw-bold text-monospace p-1"
                        style={{ backgroundColor: '#4e5052', borderRadius: 8 }}
                      >{`${prefixes}??????????????? ${selectMessageToken}`}</span>{' '}
                      ??? ???????????????.{' '}
                      <a
                        className="cursor-pointer"
                        style={{ color: 'DeepSkyBlue' }}
                        onClick={(e) => {
                          navigator.clipboard.writeText(
                            `${prefixes}??????????????? ${selectMessageToken}`
                          );
                        }}
                      >
                        ????????????
                      </a>
                    </p>
                    <p className="mb-5">
                      <ul>
                        <li>
                          Aztra??? ?????? ???????????? <b>????????? ??????</b> ????????? ?????????
                          ?????????!
                        </li>
                      </ul>
                    </p>
                  </div>
                )}
                <div className="text-center">
                  {selectMessageStatus === 'pending' && (
                    <div className="d-flex justify-content-center align-items-center">
                      <Spinner animation="grow" variant="aztra" />
                      <span className="h5 ms-2 my-auto">????????? ?????? ???</span>
                    </div>
                  )}
                  {selectMessageStatus === 'timeout' &&
                    '??????! ????????? ?????????????????????.'}
                  {selectMessageStatus === 'done' && (
                    <>
                      <b>???????????? ????????????! ?????? ????????? ?????? ???????????????!</b>
                      <div>(????????? ?????????: {newParams.message})</div>
                    </>
                  )}
                  {selectMessageStatus === 'error' && (
                    <b>????????? ??????????????????!</b>
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer className="justify-content-end">
                <Button
                  variant={selectMessageStatus === 'done' ? 'success' : 'dark'}
                  onClick={
                    selectMessageStatus === 'error'
                      ? MessageSelectionReq
                      : CancelMessageSelectionReq
                  }
                >
                  {selectMessageStatus === 'done' ? (
                    <>
                      <CheckIcon className="me-2" />
                      ????????????
                    </>
                  ) : selectMessageStatus === 'error' ? (
                    '?????? ????????????'
                  ) : (
                    '???????????? ??????'
                  )}
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </Row>
      <Row className="pt-4">
        <Col>
          <h5 className="pt-2">???????????? ?????? ????????????:</h5>
          <Form.Text>
            ???????????? ????????????, ????????? ???????????????. ????????? ??????????????? ????????????
            ???????????? ??? ????????? ??? ????????????.
          </Form.Text>
          <Form.Text>* ???????????? ???????????? ???????????? ????????? ??? ????????????</Form.Text>

          <Button
            variant="success"
            className="d-flex align-items-center mt-4"
            disabled={
              !(newData.emoji && (newData.add.length || newData.remove.length))
            }
            onClick={() => {
              setNewAddedData(
                newAddedData
                  .filter((o) => o.emoji !== newData.emoji)
                  .concat(newData as EmojiRoleData)
              );
              setNewData({ add: [], remove: [] });
            }}
          >
            <AddIcon className="me-1" fontSize="small" />
            ????????? ??? ??????
          </Button>

          <Table
            id="warn-list-table"
            className="mb-0 mt-3"
            variant="dark"
            style={{
              tableLayout: 'fixed',
            }}
          >
            <thead
              className={cx('EmojiRole-TableHead')}
              style={{ fontFamily: 'NanumSquare' }}
            >
              <tr>
                <th className="d-lg-none" />
                <th
                  style={{ fontSize: 17, width: 150 }}
                  className="text-center d-none d-lg-table-cell"
                >
                  ?????????
                </th>
                <th style={{ fontSize: 17 }}>???????????? ??? ????????? ??????</th>
                <th style={{ fontSize: 17 }}>?????? ???????????? ??? ????????? ??????</th>
                <th style={{ width: 170 }} />
              </tr>
            </thead>
            <tbody>
              {/* ????????? ?????? */}
              <tr className="d-lg-none">
                {
                  <td className="align-middle">
                    <div className="position-relative mb-3 d-flex align-items-center">
                      {newData?.emoji && (
                        <span className="me-3">
                          {emd ? (
                            <Emoji size={28} emoji={emd} set="twitter" />
                          ) : (
                            newData.emoji
                          )}
                        </span>
                      )}
                      <Dropdown>
                        <Dropdown.Toggle
                          id="ds"
                          size="sm"
                          variant="secondary"
                          className="remove-after"
                        >
                          ????????? ????????????
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="py-0">
                          <Picker
                            showSkinTones={false}
                            showPreview={false}
                            i18n={EmojiPickerI18n}
                            theme="dark"
                            set="twitter"
                            onSelect={(e) => {
                              if (!e.id) return;
                              setNewData({
                                ...newData,
                                emoji:
                                  (emoji.hasEmoji(e.id)
                                    ? emoji.get(e.id)
                                    : emoji2.get(e.id)) ?? null,
                              });
                            }}
                          />
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    <span className="pe-2">???????????? ??? ????????? ??????:</span>
                    <div className="d-flex flex-wrap align-items-center mb-2">
                      {newData?.add?.map((one) => {
                        const role = roles.find((r) => r.id === one);
                        return (
                          <RoleBadge
                            key={one}
                            className="pe-2 py-1"
                            name={role?.name ?? ''}
                            color={
                              '#' +
                              (role?.color ? role?.color.toString(16) : 'fff')
                            }
                            removeable
                            onRemove={() => {
                              setNewData({
                                ...newData,
                                add: newData?.add?.filter((r) => r !== one),
                              });
                            }}
                          />
                        );
                      })}
                      <Dropdown
                        className="dropdown-menu-dark"
                        onSelect={(key) => {
                          if (newData.add.includes(key!)) return;
                          setNewData({
                            ...newData,
                            add: newData?.add?.concat(key!) ?? newData?.add,
                          });
                        }}
                      >
                        <Dropdown.Toggle
                          className="remove-after py-1"
                          as={AddRole}
                          id="add-role-select-toggle"
                        />
                        <Dropdown.Menu
                          style={{ maxHeight: 300, overflowY: 'scroll' }}
                        >
                          {roles
                            .filter((r) => r.id !== guild?.id && !r.managed)
                            .sort((a, b) => b.position - a.position)
                            .map((r) => (
                              <Dropdown.Item
                                key={r.id}
                                eventKey={r.id}
                                style={{ color: '#' + r.color.toString(16) }}
                              >
                                {r.name}
                              </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    <span className="pe-2">?????? ???????????? ??? ????????? ??????:</span>
                    <div className="d-flex flex-wrap align-items-center mb-2">
                      {newData?.remove?.map((o) => {
                        const role = roles.find((r) => r.id === o);
                        return (
                          <RoleBadge
                            key={o}
                            className="pe-2 py-1"
                            name={role?.name ?? ''}
                            color={
                              '#' +
                              (role?.color ? role?.color.toString(16) : 'fff')
                            }
                            removeable
                            onRemove={() => {
                              setNewData({
                                ...newData,
                                remove: newData?.remove?.filter((r) => r !== o),
                              });
                            }}
                          />
                        );
                      })}
                      <Dropdown
                        className="dropdown-menu-dark"
                        onSelect={(key) => {
                          if (newData.remove.includes(key!)) return;
                          setNewData({
                            ...newData,
                            remove:
                              newData?.remove?.concat(key!) ?? newData?.remove,
                          });
                        }}
                      >
                        <Dropdown.Toggle
                          className="remove-after py-1"
                          as={AddRole}
                          id="remove-role-select-toggle"
                        />
                        <Dropdown.Menu
                          style={{ maxHeight: 300, overflowY: 'scroll' }}
                        >
                          {roles
                            .filter((r) => r.id !== guild?.id && !r.managed)
                            .sort((a, b) => b.position - a.position)
                            .map((r) => (
                              <Dropdown.Item
                                key={r.id}
                                eventKey={r.id}
                                style={{ color: '#' + r.color.toString(16) }}
                              >
                                {r.name}
                              </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </td>
                }
              </tr>

              {newAddedData.map((o, idx) => {
                const em = getEmojiDataFromNative(
                  o.emoji,
                  'twitter',
                  emojiData as any
                );

                return (
                  <tr key={o.emoji} className="d-lg-none">
                    <td className="align-middle w-100">
                      <div className="position-relative d-flex align-items-center my-2">
                        {o.emoji && (
                          <span className="me-3">
                            {em ? (
                              <Emoji size={28} emoji={em} set="twitter" />
                            ) : (
                              o.emoji
                            )}
                          </span>
                        )}
                        <Dropdown>
                          <Dropdown.Toggle
                            id="ds"
                            size="sm"
                            variant="secondary"
                            className="remove-after"
                          >
                            ????????? ????????????
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="py-0">
                            <Picker
                              showSkinTones={false}
                              showPreview={false}
                              i18n={EmojiPickerI18n}
                              theme="dark"
                              set="twitter"
                              onSelect={(e) => {
                                if (!e.id) return;
                                const data = { ...o };
                                data.emoji = emoji.hasEmoji(e.id)
                                  ? emoji.get(e.id)
                                  : emoji2.get(e.id);

                                const datas = newAddedData.filter((a) =>
                                  a.emoji !== o.emoji
                                    ? a.emoji !== data.emoji
                                    : false
                                );
                                datas.splice(idx, 0, data);
                                setNewAddedData(datas);
                              }}
                            />
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>

                      <div className="d-flex flex-wrap align-items-center position-relative my-1">
                        <span className="pe-2">???????????? ??? ????????? ??????:</span>
                        {o.add.map((one) => {
                          const role = roles.find((r) => r.id === one);
                          return (
                            <RoleBadge
                              key={one}
                              className="pe-2 py-1"
                              name={role?.name ?? ''}
                              color={
                                '#' +
                                (role?.color ? role?.color.toString(16) : 'fff')
                              }
                              removeable
                              onRemove={() => {
                                const data = { ...o };
                                data.add = o.add.filter((r) => r !== one);

                                const datas = newAddedData.filter(
                                  (a) => a.emoji !== o.emoji
                                );
                                datas.splice(idx, 0, data);
                                setNewAddedData(datas);
                              }}
                            />
                          );
                        })}
                        <Dropdown
                          className="dropdown-menu-dark"
                          onSelect={(key) => {
                            const data = { ...o };
                            data.add = o.add.concat(key!) ?? o.add;

                            const datas = newAddedData.filter(
                              (a) => a.emoji !== o.emoji
                            );
                            datas.splice(idx, 0, data);
                            setNewAddedData(datas);
                          }}
                        >
                          <Dropdown.Toggle
                            className="remove-after py-1"
                            as={AddRole}
                            id="add-role-select-toggle"
                          />
                          <Dropdown.Menu
                            style={{ maxHeight: 300, overflowY: 'scroll' }}
                          >
                            {roles
                              .filter((r) => r.id !== guild?.id && !r.managed)
                              .sort((a, b) => b.position - a.position)
                              .map((r) => (
                                <Dropdown.Item
                                  key={r.id}
                                  eventKey={r.id}
                                  style={{ color: '#' + r.color.toString(16) }}
                                >
                                  {r.name}
                                </Dropdown.Item>
                              ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>

                      <div className="d-flex flex-wrap align-items-center position-relative my-1">
                        <span className="pe-2">
                          ?????? ???????????? ??? ????????? ??????:
                        </span>
                        {o.remove.map((one) => {
                          const role = roles.find((r) => r.id === one);
                          return (
                            <RoleBadge
                              key={one}
                              className="pe-2 py-1"
                              name={role?.name ?? ''}
                              color={
                                '#' +
                                (role?.color ? role?.color.toString(16) : 'fff')
                              }
                              removeable
                              onRemove={() => {
                                const data = { ...o };
                                data.remove = o.remove.filter((r) => r !== one);

                                const datas = newAddedData.filter(
                                  (a) => a.emoji !== o.emoji
                                );
                                datas.splice(idx, 0, data);
                                setNewAddedData(datas);
                              }}
                            />
                          );
                        })}
                        <Dropdown
                          className="dropdown-menu-dark"
                          onSelect={(key) => {
                            const data = { ...o };
                            data.remove = o.remove.concat(key!) ?? o.remove;

                            const datas = newAddedData.filter(
                              (a) => a.emoji !== o.emoji
                            );
                            datas.splice(idx, 0, data);
                            setNewAddedData(datas);
                          }}
                        >
                          <Dropdown.Toggle
                            className="remove-after py-1"
                            as={AddRole}
                            id="remove-role-select-toggle"
                          />
                          <Dropdown.Menu
                            style={{ maxHeight: 300, overflowY: 'scroll' }}
                          >
                            {roles
                              .filter((r) => r.id !== guild?.id && !r.managed)
                              .sort((a, b) => b.position - a.position)
                              .map((r) => (
                                <Dropdown.Item
                                  key={r.id}
                                  eventKey={r.id}
                                  style={{ color: '#' + r.color.toString(16) }}
                                >
                                  {r.name}
                                </Dropdown.Item>
                              ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>

                      <div className="my-2">
                        <ButtonGroup>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="d-flex remove-before align-items-center"
                            onClick={() => {
                              setNewAddedData(
                                newAddedData.filter(
                                  (one) => one.emoji !== o.emoji
                                )
                              );
                            }}
                          >
                            <RemoveCircleOutline className="me-2" />
                            ??????
                          </Button>
                        </ButtonGroup>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* PC ?????? */}
              <tr className="d-none d-lg-table-row">
                <td className="text-lg-center align-middle position-relative">
                  <Dropdown>
                    <Dropdown.Toggle
                      id="ds"
                      size="sm"
                      variant={newData?.emoji ? 'dark' : 'secondary'}
                      className="remove-after"
                    >
                      {newData?.emoji ? (
                        emd ? (
                          <Emoji size={28} emoji={emd} set="twitter" />
                        ) : (
                          newData.emoji
                        )
                      ) : (
                        '????????? ????????????'
                      )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="py-0">
                      <Picker
                        showSkinTones={false}
                        showPreview={false}
                        i18n={EmojiPickerI18n}
                        theme="dark"
                        set="twitter"
                        onSelect={(e) => {
                          if (!e.id) return;
                          setNewData({
                            ...newData,
                            emoji:
                              (emoji.hasEmoji(e.id)
                                ? emoji.get(e.id)
                                : emoji2.get(e.id)) ?? null,
                          });
                        }}
                      />
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
                <td className="align-middle">
                  <div className="d-flex flex-wrap align-items-center">
                    {newData?.add?.map((one) => {
                      const role = roles.find((r) => r.id === one);
                      return (
                        <RoleBadge
                          key={one}
                          className="pe-2 py-1"
                          name={role?.name ?? ''}
                          color={
                            '#' +
                            (role?.color ? role?.color.toString(16) : 'fff')
                          }
                          removeable
                          onRemove={() => {
                            setNewData({
                              ...newData,
                              add: newData?.add?.filter((r) => r !== one),
                            });
                          }}
                        />
                      );
                    })}
                    <Dropdown
                      className="dropdown-menu-dark"
                      onSelect={(key) => {
                        if (newData.add.includes(key!)) return;
                        setNewData({
                          ...newData,
                          add: newData?.add?.concat(key!) ?? newData?.add,
                        });
                      }}
                    >
                      <Dropdown.Toggle
                        className="remove-after py-1"
                        as={AddRole}
                        id="add-role-select-toggle"
                      />
                      <Dropdown.Menu
                        style={{ maxHeight: 300, overflowY: 'scroll' }}
                      >
                        {roles
                          .filter((r) => r.id !== guild?.id && !r.managed)
                          .sort((a, b) => b.position - a.position)
                          .map((r) => (
                            <Dropdown.Item
                              key={r.id}
                              eventKey={r.id}
                              style={{ color: '#' + r.color.toString(16) }}
                            >
                              {r.name}
                            </Dropdown.Item>
                          ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </td>
                <td className="align-middle">
                  <div className="d-flex flex-wrap align-items-center">
                    {newData?.remove?.map((o) => {
                      const role = roles.find((r) => r.id === o);
                      return (
                        <RoleBadge
                          key={o}
                          className="pe-2 py-1"
                          name={role?.name ?? ''}
                          color={
                            '#' +
                            (role?.color ? role?.color.toString(16) : 'fff')
                          }
                          removeable
                          onRemove={() => {
                            setNewData({
                              ...newData,
                              remove: newData?.remove?.filter((r) => r !== o),
                            });
                          }}
                        />
                      );
                    })}
                    <Dropdown
                      className="dropdown-menu-dark"
                      onSelect={(key) => {
                        if (newData.remove.includes(key!)) return;
                        setNewData({
                          ...newData,
                          remove:
                            newData?.remove?.concat(key!) ?? newData?.remove,
                        });
                      }}
                    >
                      <Dropdown.Toggle
                        className="remove-after py-1"
                        as={AddRole}
                        id="remove-role-select-toggle"
                      />
                      <Dropdown.Menu
                        style={{ maxHeight: 300, overflowY: 'scroll' }}
                      >
                        {roles
                          .filter((r) => r.id !== guild?.id && !r.managed)
                          .sort((a, b) => b.position - a.position)
                          .map((r) => (
                            <Dropdown.Item
                              key={r.id}
                              eventKey={r.id}
                              style={{ color: '#' + r.color.toString(16) }}
                            >
                              {r.name}
                            </Dropdown.Item>
                          ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </td>
              </tr>

              <div className="mb-3" />

              {newAddedData.map((o, idx) => {
                const em = getEmojiDataFromNative(
                  o.emoji,
                  'twitter',
                  emojiData as any
                );

                return (
                  <tr key={o.emoji} className="d-none d-lg-table-row">
                    <td className="text-lg-center align-middle position-relative">
                      <Dropdown>
                        <Dropdown.Toggle
                          id="ds"
                          size="sm"
                          variant={o.emoji ? 'dark' : 'secondary'}
                          className="remove-after"
                        >
                          {o.emoji ? (
                            em ? (
                              <Emoji size={28} emoji={em} set="twitter" />
                            ) : (
                              o.emoji
                            )
                          ) : (
                            '????????? ????????????'
                          )}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="py-0">
                          <Picker
                            showSkinTones={false}
                            showPreview={false}
                            i18n={EmojiPickerI18n}
                            theme="dark"
                            set="twitter"
                            onSelect={(e) => {
                              if (!e.id) return;
                              const data = { ...o };
                              data.emoji = emoji.hasEmoji(e.id)
                                ? emoji.get(e.id)
                                : emoji2.get(e.id);

                              const datas = newAddedData.filter((a) =>
                                a.emoji !== o.emoji
                                  ? a.emoji !== data.emoji
                                  : false
                              );
                              datas.splice(idx, 0, data);
                              setNewAddedData(datas);
                            }}
                          />
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex flex-wrap align-items-center position-relative">
                        {o.add.map((one) => {
                          const role = roles.find((r) => r.id === one);
                          return (
                            <RoleBadge
                              key={one}
                              className="pe-2 py-1"
                              name={role?.name ?? ''}
                              color={
                                '#' +
                                (role?.color ? role?.color.toString(16) : 'fff')
                              }
                              removeable
                              onRemove={() => {
                                const data = { ...o };
                                data.add = o.add.filter((r) => r !== one);

                                const datas = newAddedData.filter(
                                  (a) => a.emoji !== o.emoji
                                );
                                datas.splice(idx, 0, data);
                                setNewAddedData(datas);
                              }}
                            />
                          );
                        })}
                        <Dropdown
                          className="dropdown-menu-dark"
                          onSelect={(key) => {
                            const data = { ...o };
                            data.add = o.add.concat(key!) ?? o.add;

                            const datas = newAddedData.filter(
                              (a) => a.emoji !== o.emoji
                            );
                            datas.splice(idx, 0, data);
                            setNewAddedData(datas);
                          }}
                        >
                          <Dropdown.Toggle
                            className="remove-after py-1"
                            as={AddRole}
                            id="add-role-select-toggle"
                          />
                          <Dropdown.Menu
                            style={{ maxHeight: 300, overflowY: 'scroll' }}
                          >
                            {roles
                              .filter((r) => r.id !== guild?.id && !r.managed)
                              .sort((a, b) => b.position - a.position)
                              .map((r) => (
                                <Dropdown.Item
                                  key={r.id}
                                  eventKey={r.id}
                                  style={{ color: '#' + r.color.toString(16) }}
                                >
                                  {r.name}
                                </Dropdown.Item>
                              ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex flex-wrap align-items-center position-relative">
                        {o.remove.map((one) => {
                          const role = roles.find((r) => r.id === one);
                          return (
                            <RoleBadge
                              key={one}
                              className="pe-2 py-1"
                              name={role?.name ?? ''}
                              color={
                                '#' +
                                (role?.color ? role?.color.toString(16) : 'fff')
                              }
                              removeable
                              onRemove={() => {
                                const data = { ...o };
                                data.remove = o.remove.filter((r) => r !== one);

                                const datas = newAddedData.filter(
                                  (a) => a.emoji !== o.emoji
                                );
                                datas.splice(idx, 0, data);
                                setNewAddedData(datas);
                              }}
                            />
                          );
                        })}
                        <Dropdown
                          className="dropdown-menu-dark"
                          onSelect={(key) => {
                            const data = { ...o };
                            data.remove = o.remove.concat(key!) ?? o.remove;

                            const datas = newAddedData.filter(
                              (a) => a.emoji !== o.emoji
                            );
                            datas.splice(idx, 0, data);
                            setNewAddedData(datas);
                          }}
                        >
                          <Dropdown.Toggle
                            className="remove-after py-1"
                            as={AddRole}
                            id="remove-role-select-toggle"
                          />
                          <Dropdown.Menu
                            style={{ maxHeight: 300, overflowY: 'scroll' }}
                          >
                            {roles
                              .filter((r) => r.id !== guild?.id && !r.managed)
                              .sort((a, b) => b.position - a.position)
                              .map((r) => (
                                <Dropdown.Item
                                  key={r.id}
                                  eventKey={r.id}
                                  style={{ color: '#' + r.color.toString(16) }}
                                >
                                  {r.name}
                                </Dropdown.Item>
                              ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex justify-content-end">
                        <ButtonGroup>
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`emoji-remove-list-${idx}`}>
                                ??????
                              </Tooltip>
                            }
                          >
                            <Button
                              variant="dark"
                              className="d-flex px-1 remove-before"
                              onClick={() => {
                                setNewAddedData(
                                  newAddedData.filter(
                                    (one) => one.emoji !== o.emoji
                                  )
                                );
                              }}
                            >
                              <RemoveCircleOutline />
                            </Button>
                          </OverlayTrigger>
                        </ButtonGroup>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
      <Row>
        <Col>
          <hr
            className="mt-0"
            style={{ borderColor: '#4e5058', borderWidth: 2 }}
          />
          <div className="d-flex">
            <Button
              className="ps-2 d-flex justify-content-center align-items-center"
              variant={saveError ? 'danger' : 'aztra'}
              disabled={
                saving ||
                saveError ||
                !(
                  newParams.channel &&
                  newParams.message &&
                  (newAddedData.length ||
                    (newData.emoji &&
                      (newData.add.length || newData.remove.length)))
                ) ||
                (!!newAddedData.length &&
                  !newAddedData.some((o) => o.add.length || o.remove.length))
              }
              onClick={(event) =>
                onSubmit &&
                onSubmit(
                  {
                    params: newParams as EmojiRoleParams,
                    data: newAddedData
                      .filter((o) => o.add.length || o.remove.length)
                      .concat(
                        newData.emoji &&
                          (newData.add.length || newData.remove.length)
                          ? [newData as EmojiRoleData]
                          : []
                      ),
                  },
                  event
                )
              }
              style={{
                minWidth: 140,
              }}
            >
              {saving ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                  />
                  <span className="ps-2">?????? ???...</span>
                </>
              ) : (
                <span>
                  {saveError ? (
                    '??????'
                  ) : (
                    <>
                      <CheckIcon className="me-1" />
                      {editMode ? '?????? ????????????' : '?????? ????????????'}
                    </>
                  )}
                </span>
              )}
            </Button>
            {closeButton && (
              <Button
                variant="danger"
                className="ms-3 align-items-center d-flex"
                onClick={() => onClose && onClose()}
              >
                <CloseIcon className="me-1" />
                ???????????? ??????
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default EmojiRole;
