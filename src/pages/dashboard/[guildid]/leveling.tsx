import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import api from 'datas/api';

import { LevelingSet } from 'types/dbtypes';
import { GetServerSideProps, NextPage } from 'next';
import Cookies from 'universal-cookie';
import Layout from 'components/Layout';
import DashboardLayout from 'components/DashboardLayout';
import useSWR from 'swr';
import urljoin from 'url-join';
import Head from 'next/head';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Code as CodeIcon } from '@mui/icons-material';
import ChannelSelectCard from 'components/forms/ChannelSelectCard';
import { ChannelMinimal } from 'types/DiscordTypes';
import filterChannels from 'utils/filterChannels';
import TextareaAutosize from 'react-textarea-autosize';
import Router from 'next/router';
import ChangesNotSaved from 'components/ChangesNotSaved';

type handleFieldChangeTypes = 'channel' | 'format';

interface LevelingRouterProps {
  guildId: string;
}

export const getServerSideProps: GetServerSideProps<
  LevelingRouterProps
> = async (context) => {
  const { guildid } = context.query;
  return {
    props: {
      guildId: guildid as string,
    },
  };
};

const Leveling: NextPage<LevelingRouterProps> = ({ guildId }) => {
  const [useLevelupMessage, setUseLevelupMessage] = useState(false);
  const [useLeveling, setUseLeveling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const [validChannel, setValidChannel] = useState<boolean | null>(null);
  const [validFormat, setValidFormat] = useState<boolean | null>(null);
  const [channelSearch, setChannelSearch] = useState('');
  const [newChannel, setNewChannel] = useState<string | null>(null);
  const [newFormat, setNewFormat] = useState<string | null>(null);
  const [useSpecificChannel, setUseSpecificChannel] = useState(false);
  const [showFormattings, setShowFormattings] = useState(false);

  const [exceptAztraCommand, setExceptAztraCommand] = useState(false);
  const [exceptAttachments, setExceptAttachments] = useState(false);

  const [preload, setPreload] = useState(true);
  const [changed, setChanged] = useState(false);

  const initData = (data: LevelingSet | null) => {
    setUseLeveling(!!data);
    setUseLevelupMessage(data?.channel !== false);
    setUseSpecificChannel(typeof data?.channel === 'string');
    setExceptAztraCommand(data?.except_command ?? false);
    setExceptAttachments(data?.except_attachments ?? false);
  };

  const { data, mutate } = useSWR<LevelingSet | null, AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/servers/${guildId}/leveling`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data),
    {
      onSuccess: initData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: channels } = useSWR<ChannelMinimal[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/discord/guilds/${guildId}/channels`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data)
  );

  const setValidate = (type?: handleFieldChangeTypes) => {
    const All = [
      useLeveling && useLevelupMessage && useSpecificChannel
        ? !!data?.channel || !!newChannel
          ? null
          : false
        : null,
      newFormat !== null
        ? newFormat.length <= 2000
          ? null
          : useLevelupMessage
          ? false
          : null
        : null,
    ];
    const [CH, FM] = All;

    switch (type) {
      case 'channel':
        setValidChannel(CH);
        break;
      case 'format':
        setValidFormat(FM);
        break;
      default:
        for (let x of ['channel', 'format']) {
          setValidate(x as handleFieldChangeTypes);
        }
    }
    return All;
  };

  const checkValidate = () => {
    return setValidate()?.every((o) => o === null) ?? false;
  };

  const save = async () => {
    setSaving(true);
    if (newFormat === '')
      setNewFormat(
        '${usermention} ?????? ????????? **${afterlevel}**??? ???????????????!'
      );
    let saveData:
      | (Omit<LevelingSet, 'guild' | 'format'> & { format: string | null })
      | null = useLeveling
      ? {
          channel: useLevelupMessage
            ? useSpecificChannel
              ? newChannel ?? data?.channel ?? null
              : null
            : false,
          format:
            (newFormat === ''
              ? '${usermention} ?????? ????????? **${afterlevel}**??? ???????????????!'
              : newFormat) ??
            data?.format ??
            null,
          except_command: exceptAztraCommand,
          except_attachments: exceptAttachments,
        }
      : null;

    try {
      if (useLeveling) {
        await axios.post(`${api}/servers/${guildId}/leveling`, saveData, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        });
      } else {
        await axios.delete(`${api}/servers/${guildId}/leveling`, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        });
      }

      await mutate();
    } catch (e) {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (data !== undefined && channels) {
      setTimeout(() => setPreload(false), 1000);
    }
  }, [data, channels]);

  useEffect(() => {
    if (!new Cookies().get('ACCESS_TOKEN')) {
      const lct = window.location;
      localStorage.setItem('loginFrom', lct.pathname + lct.search);
      window.location.assign('/login');
    }

    if (data) initData(data);
  }, [data]);

  useEffect(() => {
    const message = '???????????? ?????? ??????????????? ????????????. ?????????????????????????';

    const routeChangeStart = (url: string) => {
      if (Router.asPath !== url && changed && !confirm(message)) {
        Router.events.emit('routeChangeError');
        Router.replace(Router, Router.asPath);
        throw 'Abort route change. Please ignore this error.';
      }
    };

    const beforeunload = (e: BeforeUnloadEvent) => {
      if (changed) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', beforeunload);
    Router.events.on('routeChangeStart', routeChangeStart);

    return () => {
      window.removeEventListener('beforeunload', beforeunload);
      Router.events.off('routeChangeStart', routeChangeStart);
    };
  }, [changed]);

  const handleSubmit = () => {
    if (checkValidate()) {
      save();
    }
  };

  const isChanged = () => {
    if (data === undefined) {
      setChanged(false);
      return false;
    }

    const rst =
      !!data !== useLeveling ||
      (useLeveling &&
        !!data &&
        ((newFormat !== null && data.format !== newFormat) ||
          exceptAztraCommand !== data.except_command ||
          exceptAttachments !== data.except_attachments ||
          (useLevelupMessage
            ? data.channel === false
            : data.channel !== false) ||
          (useLevelupMessage &&
            data.channel !== false &&
            (useSpecificChannel !== !!data.channel ||
              (useSpecificChannel &&
                newChannel &&
                data.channel !== newChannel)))));

    setChanged(!!rst);
    return !!rst;
  };

  return (
    <>
      <Head>
        <title>????????? ?????? - Aztra ????????????</title>
      </Head>
      <Layout>
        <DashboardLayout guildId={guildId}>
          {() =>
            data !== undefined && channels ? (
              <div>
                <Row className="dashboard-section">
                  <div>
                    <h3>????????? ??????</h3>
                    <div className="py-2">
                      ????????? ???????????? ?????? ??? ?????? ???????????? ??????, ????????? ?????? ???
                      ????????????.
                    </div>
                  </div>
                </Row>
                <Row>
                  <Col>
                    <Form noValidate>
                      <Row>
                        <Form.Group controlId="levelingSetting">
                          <Form.Check
                            id="useLeveling"
                            type="switch"
                            label={
                              <div className="ps-2">
                                ???????????? ?????? ????????? ????????? ????????????
                              </div>
                            }
                            checked={useLeveling}
                            onChange={() => setUseLeveling(!useLeveling)}
                            aria-controls="useLeveling"
                            aria-expanded={!!useLeveling}
                          />
                        </Form.Group>
                      </Row>

                      {useLeveling && (
                        <>
                          <Modal
                            className="modal-dark"
                            show={showFormattings}
                            onHide={() => setShowFormattings(false)}
                            centered
                            size="lg"
                          >
                            <Modal.Header closeButton>
                              <Modal.Title
                                style={{
                                  fontFamily: 'NanumSquare',
                                  fontWeight: 900,
                                }}
                              >
                                ???????????? ??????
                              </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="py-4">
                              <Table variant="dark" responsive="xl">
                                <thead>
                                  <tr>
                                    <th>??????</th>
                                    <th style={{ minWidth: 120 }}>??????</th>
                                    <th>??????</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    ['username', '?????? ????????? ??????', 'Aztra'],
                                    ['usertag', '?????? ????????? ??????', '2412'],
                                    [
                                      'userid',
                                      '?????? ????????? ID',
                                      '751339721782722570',
                                    ],
                                    ['guild', '????????? ??????', "Arpa's Server"],
                                    ['usermention', '????????? ??????', '@Aztra'],
                                    ['beforelevel', '????????? ?????? ??????', '16'],
                                    ['afterlevel', '????????? ?????? ??????', '17'],
                                    ['beforeexp', '????????? ?????? ?????????', '1764'],
                                    ['afterexp', '????????? ?????? ?????????', '1765'],
                                  ].map(([c, d, e]) => (
                                    <tr key={c as string}>
                                      <td>${`{${c}}`}</td>
                                      <td>{d}</td>
                                      <td>{e}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </Modal.Body>
                            <Modal.Footer className="justify-content-end">
                              <Button
                                variant="dark"
                                onClick={() => setShowFormattings(false)}
                              >
                                ??????
                              </Button>
                            </Modal.Footer>
                          </Modal>

                          <Row className="pt-4 pb-2">
                            <div className="d-flex align-items-center">
                              <h4>?????? ????????? ??????</h4>
                              <Button
                                variant="dark"
                                className="ms-auto d-flex align-items-center mb-2"
                                size="sm"
                                onClick={() => setShowFormattings(true)}
                              >
                                <CodeIcon className="me-2" fontSize="small" />
                                ???????????? ??????
                              </Button>
                            </div>
                          </Row>

                          <Row className="ms-3">
                            <Form.Label column sm="auto">
                              ????????? ????????? ??????
                            </Form.Label>
                            <Col>
                              <Form.Group controlId="message-content">
                                <Form.Control
                                  className="shadow"
                                  isInvalid={validFormat === false}
                                  as={TextareaAutosize}
                                  type="text"
                                  placeholder="???) ${usermention} ?????? ????????? **${afterlevel}**??? ???????????????!"
                                  value={newFormat ?? data?.format}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setNewFormat(value);
                                    setValidFormat(
                                      value.length <= 2000 ? null : false
                                    );
                                  }}
                                />
                                <div className="d-flex justify-content-between">
                                  <Form.Text>
                                    ???????????? ??????????????? ???????????????.
                                  </Form.Text>
                                  <Form.Text
                                    className={
                                      ((newFormat ?? data?.format)?.length ??
                                        0) > 2000
                                        ? 'text-danger'
                                        : ''
                                    }
                                  >
                                    {(newFormat ?? data?.format)?.length ?? 0}
                                    /2000
                                  </Form.Text>
                                </div>
                                <Form.Control.Feedback type="invalid">
                                  ????????? ??? ????????? ?????? 2000?????? ????????? ???
                                  ????????????!
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row className="pt-4 pb-2">
                            <h4>????????? ?????? ??????</h4>
                          </Row>

                          <Row className="ms-3 pb-2">
                            <Col>
                              <Form.Group controlId="expExceptSettings">
                                <Form.Check
                                  id="exceptAztraCommand"
                                  className="mb-2"
                                  type="checkbox"
                                  label={
                                    <div className="ps-2">
                                      ???????????? ????????? Aztra ????????? ??????
                                    </div>
                                  }
                                  checked={exceptAztraCommand}
                                  onChange={() =>
                                    setExceptAztraCommand(!exceptAztraCommand)
                                  }
                                  aria-controls="exceptAztraCommand"
                                  aria-expanded={!!exceptAztraCommand}
                                />
                                <Form.Check
                                  id="exceptAttachments"
                                  type="checkbox"
                                  label={
                                    <div className="ps-2">
                                      ??????, ??????, ????????? ?????? ????????? ??????
                                    </div>
                                  }
                                  checked={exceptAttachments}
                                  onChange={() =>
                                    setExceptAttachments(!exceptAttachments)
                                  }
                                  aria-controls="exceptAttachments"
                                  aria-expanded={!!exceptAttachments}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          <hr
                            className="my-3"
                            style={{ borderColor: '#4e5058', borderWidth: 2 }}
                          />

                          <Row className="py-3">
                            <Form.Group controlId="useLevelupMessage">
                              <Form.Check
                                id="useLevelupMessage"
                                type="switch"
                                label={
                                  <div className="ps-2">
                                    ????????? ????????? ????????? ??? ????????? ?????????
                                  </div>
                                }
                                checked={useLevelupMessage}
                                onChange={() =>
                                  setUseLevelupMessage(!useLevelupMessage)
                                }
                                aria-controls="useLevelupMessage"
                                aria-expanded={!!useLevelupMessage}
                              />
                            </Form.Group>
                          </Row>
                        </>
                      )}

                      {useLeveling && useLevelupMessage && (
                        <Row className="pt-1 mx-3">
                          <Col>
                            <Form.Check
                              className="mb-2"
                              type="radio"
                              label="???????????? ????????? ????????? ????????????"
                              id="send_to_message_channel"
                              checked={!useSpecificChannel}
                              onChange={() =>
                                setUseSpecificChannel(!useSpecificChannel)
                              }
                            />
                            <Form.Check
                              type="radio"
                              label="?????? ????????? ????????????"
                              id="send_to_specific_channel"
                              checked={useSpecificChannel}
                              onChange={() =>
                                setUseSpecificChannel(!useSpecificChannel)
                              }
                            />
                          </Col>
                        </Row>
                      )}

                      {useLeveling && useLevelupMessage && useSpecificChannel && (
                        <>
                          <Row className="pt-5 pb-2">
                            <h4 className="pe-5">?????? ??????</h4>
                          </Row>
                          <Row>
                            <Col lg={8}>
                              <Form.Group>
                                <Container fluid>
                                  <Row className="mb-3 flex-column">
                                    {channels?.find(
                                      (one) =>
                                        one.id === (newChannel ?? data?.channel)
                                    ) ? (
                                      <>
                                        <h5 className="pe-2 px-0">
                                          ?????? ?????????:{' '}
                                        </h5>
                                        <Card bg="secondary">
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
                                            {
                                              channels?.find(
                                                (one) =>
                                                  one.id ===
                                                  (newChannel ?? data?.channel)
                                              )?.name
                                            }
                                          </Card.Header>
                                        </Card>
                                      </>
                                    ) : (
                                      <Form.Label
                                        as="h5"
                                        className={
                                          validChannel === false
                                            ? 'text-danger fw-bold'
                                            : ''
                                        }
                                      >
                                        ????????? ????????? ????????????!
                                      </Form.Label>
                                    )}
                                  </Row>
                                  <Row className="pb-2">
                                    <input hidden={true} />
                                    <Form.Control
                                      type="text"
                                      placeholder="?????? ??????"
                                      onChange={(e) =>
                                        setChannelSearch(e.target.value)
                                      }
                                    />
                                    <Form.Text className="py-1">
                                      {channels?.length}??? ?????? ??????
                                    </Form.Text>
                                  </Row>
                                  <Row
                                    style={{
                                      maxHeight: 220,
                                      overflow: 'auto',
                                      borderRadius: '10px',
                                      display: 'block',
                                    }}
                                  >
                                    {channels ? (
                                      filterChannels(
                                        channels,
                                        channelSearch
                                      ).map((one) => (
                                        <ChannelSelectCard
                                          key={one.id}
                                          selected={
                                            (newChannel ?? data?.channel) ===
                                            one.id
                                          }
                                          channelData={{
                                            channelName: one.name,
                                            parentChannelName: channels?.find(
                                              (c) => c.id === one.parentId
                                            )?.name,
                                          }}
                                          onClick={() => setNewChannel(one.id)}
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
                        </>
                      )}

                      {!saveError && isChanged() ? (
                        <ChangesNotSaved
                          key="changesNotSaved1"
                          onSave={handleSubmit}
                          onReset={() => initData(data)}
                          isSaving={saving}
                          isSaveError={saveError}
                        />
                      ) : (
                        <div style={{ opacity: preload ? 0 : 1 }}>
                          <ChangesNotSaved key="changesNotSaved2" close />
                        </div>
                      )}
                    </Form>
                  </Col>
                </Row>
              </div>
            ) : (
              <Container
                className="d-flex align-items-center justify-content-center flex-column"
                style={{
                  height: '500px',
                }}
              >
                <h3 className="pb-4">???????????? ???</h3>
                <Spinner animation="border" variant="aztra" />
              </Container>
            )
          }
        </DashboardLayout>
      </Layout>
    </>
  );
};

export default Leveling;
