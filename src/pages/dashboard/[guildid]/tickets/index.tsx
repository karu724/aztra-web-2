import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
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
  Delete as DeleteIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  FormatListBulleted as ListIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import api from 'datas/api';

import { GetServerSideProps, NextPage } from 'next';
import Router from 'next/router';
import Cookies from 'universal-cookie';
import Layout from 'components/Layout';
import DashboardLayout from 'components/DashboardLayout';
import useSWR from 'swr';
import urljoin from 'url-join';
import Head from 'next/head';
import { TicketSet } from 'types/dbtypes';
import { ChannelMinimal, Role } from 'types/DiscordTypes';
import { animateScroll } from 'react-scroll';
import TicketForm from 'components/tickets/TicketForm';
import { Emoji, getEmojiDataFromNative } from 'emoji-mart';
import emojiData from 'emoji-mart/data/all.json';

interface TicketSetsRouterProps {
  guildId: string;
}

export const getServerSideProps: GetServerSideProps<
  TicketSetsRouterProps
> = async (context) => {
  const { guildid } = context.query;
  return {
    props: {
      guildId: guildid as string,
    },
  };
};

interface TicketsetListCardProps {
  onCheckChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  checked?: boolean;
  ticketSet: TicketSet;
}

const TicketSets: NextPage<TicketSetsRouterProps> = ({ guildId }) => {
  const [addNew, setAddNew] = useState(false);

  const [selectedTicketSets, setSelectedTicketSets] = useState<Set<string>>(
    new Set()
  );
  const [showSelectedDel, setShowSelectedDel] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isMD, setIsMD] = useState<boolean | null>(null);

  const { data, mutate } = useSWR<TicketSet[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/servers/${guildId}/ticketsets`)
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

  const { data: roles } = useSWR<Role[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/discord/guilds/${guildId}/roles`)
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

  useEffect(() => {
    if (!new Cookies().get('ACCESS_TOKEN')) {
      const lct = window.location;
      localStorage.setItem('loginFrom', lct.pathname + lct.search);
      window.location.assign('/login');
    } else {
      const resize = () => setIsMD(window.innerWidth >= 768);
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  }, []);

  const TicketsetListCard: React.FC<TicketsetListCardProps> = ({
    ticketSet,
    onCheckChange,
    checked,
  }) => {
    const Actions: React.FC = () => (
      <ButtonGroup>
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="task-list-row-remove-task">?????? ??????</Tooltip>}
        >
          <Button
            variant="dark"
            className="d-flex px-1 remove-before bg-transparent border-0"
            onClick={() =>
              Router.push(
                `/dashboard/${guildId}/tickets/${ticketSet.uuid}/list`,
                undefined,
                { shallow: true }
              )
            }
          >
            <ListIcon />
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="task-list-row-remove-task">?????? ?????? ??????</Tooltip>
          }
        >
          <Button
            variant="dark"
            className="d-flex px-1 remove-before bg-transparent border-0"
            onClick={() =>
              Router.push(
                `/dashboard/${guildId}/tickets/${ticketSet.uuid}/settings`,
                undefined,
                { shallow: true }
              )
            }
          >
            <SettingsIcon />
          </Button>
        </OverlayTrigger>
      </ButtonGroup>
    );

    const emd = getEmojiDataFromNative(
      ticketSet.emoji,
      'twitter',
      emojiData as any
    );

    return (
      <>
        <tr>
          {isMD ? (
            <>
              <td className="align-middle text-center">
                <Form.Check
                  id={`taskset-check-${ticketSet.uuid}`}
                  type="checkbox"
                  checked={checked}
                  onChange={onCheckChange}
                />
              </td>
              <td className="align-middle">
                <span className="d-inline-block text-truncate mw-100 align-middle cursor-pointer font-weight-bold">
                  {ticketSet.name}
                </span>
              </td>
              <td className="align-middle">
                {emd ? (
                  <Emoji size={28} emoji={emd} set="twitter" />
                ) : (
                  ticketSet.emoji
                )}
              </td>
              <td className="align-middle">
                <span className="d-inline-block text-truncate mw-100 align-middle cursor-pointer font-weight-bold">
                  #
                  {channels?.find((o) => o.id === ticketSet.channel)?.name ?? (
                    <i>(???????????? ?????? ??????)</i>
                  )}
                </span>
              </td>
              <td className="align-middle">
                <span className="d-inline-block text-truncate mw-100 align-middle cursor-pointer font-weight-bold">
                  {ticketSet.category_opened ? (
                    <>
                      #
                      {channels?.find((o) => o.id === ticketSet.category_opened)
                        ?.name ?? <i>(???????????? ?????? ??????)</i>}
                    </>
                  ) : (
                    '(?????? ??? ???)'
                  )}
                </span>
              </td>
              <td className="align-middle text-center">
                <Actions />
              </td>
            </>
          ) : (
            <>
              <td className="align-top text-center">
                <Form.Check
                  id={`ticketset-check-${ticketSet.uuid}`}
                  type="checkbox"
                  checked={checked}
                  onChange={onCheckChange}
                />
              </td>
              <td>
                <div className="font-weight-bold pb-2" style={{ fontSize: 18 }}>
                  {ticketSet.name}
                </div>
                <div>
                  <div>
                    ?????????:{' '}
                    {emd ? (
                      <Emoji size={28} emoji={emd} set="twitter" />
                    ) : (
                      ticketSet.emoji
                    )}
                  </div>
                  <div>
                    ??????:{' '}
                    <b className="ms-2">
                      #
                      {channels?.find((o) => o.id === ticketSet.channel)
                        ?.name ?? <i>(???????????? ?????? ??????)</i>}
                    </b>
                  </div>
                  <div>
                    ?????? ????????????:{' '}
                    <b className="ms-2">
                      {ticketSet.category_opened
                        ? `#${
                            channels?.find(
                              (o) => o.id === ticketSet.category_opened
                            )?.name ?? <i>(???????????? ?????? ??????)</i>
                          }`
                        : '(?????? ??? ???)'}
                    </b>
                  </div>
                  <div className="mt-2">
                    <Actions />
                  </div>
                </div>
              </td>
            </>
          )}
        </tr>
      </>
    );
  };

  const delSelectedTicketSets = () => {
    axios
      .delete(`${api}/servers/${guildId}/ticketsets`, {
        data: {
          ticketsets: Array.from(finalSelectedSet),
        },
        headers: {
          Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
        },
      })
      .then(() => {
        setSelectedTicketSets(new Set());
        mutate();
      });
  };

  const ticketSetsSet = new Set(data?.map((o) => o.uuid));
  const finalSelectedSet = new Set(
    Array.from(selectedTicketSets).filter((o) => ticketSetsSet.has(o))
  );

  return (
    <>
      <Head>
        <title>?????? ?????? - Aztra ????????????</title>
      </Head>
      <Layout>
        <DashboardLayout guildId={guildId}>
          {(guild) =>
            guild && data && channels ? (
              <div>
                <Row className="dashboard-section">
                  <div>
                    <h3>?????? ??????</h3>
                    <div className="py-2">
                      ????????? ????????? ???????????? ????????? ?????? ????????? ????????????
                      ???????????? 1:1 ??????/?????? ?????? ????????? ??? ????????????.
                    </div>
                  </div>
                </Row>
                <Row>
                  <Col>
                    <Form noValidate>
                      {addNew && (
                        <Row className="mb-5">
                          <Col className="p-0">
                            <Card bg="dark" className="m-0 shadow">
                              <Card.Header className="d-flex justify-content-between align-items-center">
                                <span
                                  className="font-weight-bold"
                                  style={{
                                    fontFamily: 'NanumSquare',
                                    fontSize: 18,
                                  }}
                                >
                                  ??? ?????? ??????
                                </span>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="d-flex align-items-center"
                                  onClick={() => {
                                    setAddNew(false);
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </Button>
                              </Card.Header>
                              <Card.Body>
                                <Form noValidate>
                                  <Form.Group className="mb-0">
                                    <TicketForm
                                      guild={guild}
                                      channels={channels ?? []}
                                      roles={roles ?? []}
                                      saving={saving}
                                      saveError={saveError}
                                      onSubmit={(data) => {
                                        setSaving(true);
                                        axios
                                          .post(
                                            `${api}/servers/${guildId}/ticketsets`,
                                            data,
                                            {
                                              headers: {
                                                Authorization: `Bearer ${new Cookies().get(
                                                  'ACCESS_TOKEN'
                                                )}`,
                                              },
                                            }
                                          )
                                          .then(() => {
                                            mutate().then(() => {
                                              animateScroll.scrollToTop({
                                                isDynamic: true,
                                              });
                                              setAddNew(false);
                                            });
                                          })
                                          .catch(() => setSaveError(true))
                                          .finally(() => setSaving(false));
                                      }}
                                    />
                                  </Form.Group>
                                </Form>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      )}

                      <Row className="justify-content-end align-items-center pt-2">
                        <div className="d-flex justify-content-end align-items-center">
                          <div
                            className="me-4"
                            style={{
                              color: data.length >= 15 ? 'gold' : 'white',
                            }}
                          >
                            <b>{data.length}/15</b> ??? ?????????
                          </div>
                          <Button
                            variant="aztra"
                            size="sm"
                            className="d-flex align-items-center my-1"
                            onClick={() => {
                              setAddNew(true);
                              animateScroll.scrollToTop({
                                duration: 500,
                              });
                            }}
                          >
                            <AddIcon className="me-1" />
                            ?????? ??????
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="d-flex align-items-center ms-3 my-1"
                            disabled={!finalSelectedSet.size}
                            onClick={() => setShowSelectedDel(true)}
                          >
                            <DeleteIcon className="me-1" />
                            ?????? ?????? ??????
                          </Button>
                        </div>
                      </Row>

                      <Row>
                        <Modal
                          className="modal-dark"
                          show={showSelectedDel}
                          onHide={() => setShowSelectedDel(false)}
                          centered
                        >
                          <Modal.Header closeButton>
                            <Modal.Title
                              style={{
                                fontFamily: 'NanumSquare',
                                fontWeight: 900,
                              }}
                            >
                              ?????? ?????? ????????????
                            </Modal.Title>
                          </Modal.Header>
                          <Modal.Body className="py-4">
                            ????????? ?????? ?????? {finalSelectedSet.size}??????
                            ?????????????????????????
                          </Modal.Body>
                          <Modal.Footer className="justify-content-end">
                            <Button
                              variant="danger"
                              onClick={async () => {
                                setShowSelectedDel(false);
                                delSelectedTicketSets();
                              }}
                            >
                              ??????
                            </Button>
                            <Button
                              variant="dark"
                              onClick={() => setShowSelectedDel(false)}
                            >
                              ??????
                            </Button>
                          </Modal.Footer>
                        </Modal>
                      </Row>

                      <Row className="flex-column mt-3">
                        <Table
                          id="ticketset-list-table"
                          variant="dark"
                          style={{
                            tableLayout: 'fixed',
                          }}
                          hover
                        >
                          <thead>
                            <tr>
                              <th
                                className="align-middle text-center"
                                style={{ width: 50 }}
                              >
                                <Form.Check
                                  id="ticketsets-select-all"
                                  type="checkbox"
                                  checked={
                                    !!data?.length &&
                                    ticketSetsSet.size ===
                                      finalSelectedSet.size &&
                                    Array.from(ticketSetsSet).every((value) =>
                                      finalSelectedSet.has(value)
                                    )
                                  }
                                  onChange={() => {
                                    if (
                                      ticketSetsSet.size ===
                                        finalSelectedSet.size &&
                                      Array.from(ticketSetsSet).every((value) =>
                                        finalSelectedSet.has(value)
                                      )
                                    ) {
                                      setSelectedTicketSets(new Set());
                                    } else {
                                      setSelectedTicketSets(ticketSetsSet);
                                    }
                                  }}
                                />
                              </th>
                              <th
                                className="text-center text-md-start d-none d-md-table-cell"
                                style={{ maxWidth: 400 }}
                              >
                                ??????
                              </th>
                              <th
                                className="text-center text-md-start d-none d-md-table-cell"
                                style={{ maxWidth: 150 }}
                              >
                                ?????????
                              </th>
                              <th
                                className="text-center text-md-start d-none d-md-table-cell"
                                style={{ maxWidth: 150 }}
                              >
                                ??????
                              </th>
                              <th className="text-center text-md-start d-none d-md-table-cell">
                                ?????? ????????????
                              </th>
                              <th
                                style={{ width: 100 }}
                                className="d-none d-md-table-cell"
                              />
                              <th className="d-md-none" />
                            </tr>
                          </thead>
                          <tbody>
                            {data?.map((one) => (
                              <TicketsetListCard
                                key={one.uuid}
                                ticketSet={one}
                                checked={finalSelectedSet.has(one.uuid)}
                                onCheckChange={() => {
                                  let sel = new Set(finalSelectedSet);

                                  if (sel.has(one.uuid)) {
                                    sel.delete(one.uuid);
                                  } else {
                                    sel.add(one.uuid);
                                  }

                                  setSelectedTicketSets(sel);
                                }}
                              />
                            ))}
                          </tbody>
                        </Table>
                      </Row>
                      <Row className="text-center">
                        {!data.length && (
                          <div className="my-5" style={{ color: 'lightgray' }}>
                            ????????? ????????? ????????????!{' '}
                            <span
                              className="cursor-pointer"
                              style={{ color: 'deepskyblue' }}
                              onClick={() => {
                                setAddNew(true);
                                animateScroll.scrollToTop({
                                  duration: 500,
                                });
                              }}
                            >
                              ?????? ??????
                            </span>
                            ????????????!
                          </div>
                        )}
                      </Row>
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

export default TicketSets;
